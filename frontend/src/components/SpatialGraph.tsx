import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  testNodes,
  testEdges,
  testPaths,
  testCompanies,
  directionColors,
  directionNames,
  graphAssets,
} from "./spatial/data";
import type { NodeKey } from "./spatial/data";
import { advance, curve, settle, smooth, spring } from "./spatial/motion";
import { focusCamera, zoomCamera, fitCamera } from "./spatial/geometry";
import { DelayedPreview } from "./spatial/hover";
import "./spatial/graph.css";

export interface SpatialSelection {
  nodeKey: NodeKey | null;
  pathId: string;
  testCompanyIds: string[];
  filtered: boolean;
}
export interface SpatialCheckpoint {
  label: string;
  camera: { x: number; y: number; z: number };
  held: boolean;
  selected: NodeKey | null;
  pathId: string;
  filtered: boolean;
  positions: Record<string, { x: number; y: number; dx: number; dy: number }>;
  progress: Record<number, number>;
  elapsed: number;
  scroll: number;
}
export interface SpatialGraphHandle {
  captureContext: () => SpatialCheckpoint;
  restoreContext: (checkpoint: SpatialCheckpoint) => void;
  reset: () => void;
  getDebugState: () => SpatialCheckpoint & {
    historyCount: number;
    forwardCount: number;
    pathActive: boolean;
    expanded: boolean;
    performanceReduced: boolean;
  };
}
export interface SpatialGraphProps {
  eventId: string;
  testCompanyMode?: boolean;
  reducedMotion?: boolean;
  paused?: boolean;
  researchOpen?: boolean;
  onSelectionChange?: (selection: SpatialSelection) => void;
  onNodeResearch?: (nodeKey: NodeKey, checkpoint: SpatialCheckpoint) => void;
  onCompanyCompare?: (checkpoint: SpatialCheckpoint) => void;
  onFilterChange?: (filtered: boolean, nodeKey: NodeKey | null) => void;
  onExpandedChange?: (expanded: boolean) => void;
}
function newPositions() {
  return Object.fromEntries(
    testNodes.map((n) => [
      n.key,
      {
        x: n.x,
        y: n.y,
        dx: 0,
        dy: 0,
        idleX: spring(0, 80, 16),
        idleY: spring(0, 80, 16),
        scale: spring(1, 280, 22),
      },
    ]),
  );
}
/** This component owns TEST interaction only. Business-company data is deliberately not accepted. */
export const SpatialGraph = forwardRef<SpatialGraphHandle, SpatialGraphProps>(
  function SpatialGraph(props, ref) {
    const [selected, setSelected] = useState<NodeKey | null>(null),
      [pathId, setPathId] = useState("negative"),
      [held, setHeld] = useState(false),
      [filtered, setFiltered] = useState(false);
    const [expanded, setExpanded] = useState(false),
      [historyOpen, setHistoryOpen] = useState(false),
      [counts, setCounts] = useState({ past: 0, future: 0 });
    const [playState, setPlayState] = useState<
        "playing" | "paused" | "complete"
      >("playing"),
      [systemReduced, setSystemReduced] = useState(false),
      [notice, setNotice] = useState("");
    const [performanceReduced, setPerformanceReduced] = useState(false);
    const [preview, setPreview] = useState<NodeKey | null>(null),
      previewKey = useRef<NodeKey | null>(null);
    const previewController = useRef<DelayedPreview<NodeKey> | null>(null);
    const card = useRef<HTMLElement>(null),
      layoutMotion = useRef(spring(540, 100, 18));
    const prefix = useId().replace(/:/g, ""),
      canvas = useRef<HTMLDivElement>(null),
      svg = useRef<SVGSVGElement>(null),
      world = useRef<SVGGElement>(null),
      popover = useRef<HTMLDivElement>(null),
      status = useRef<HTMLSpanElement>(null);
    const camera = useRef({ x: spring(0), y: spring(0), z: spring(1) }),
      positions = useRef(newPositions()),
      viewport = useRef({ w: 1064, h: 388 });
    const history = useRef<SpatialCheckpoint[]>([]),
      future = useRef<SpatialCheckpoint[]>([]),
      pointer = useRef<{
        id: number;
        key: NodeKey | null;
        x: number;
        y: number;
        sx: number;
        sy: number;
        moved: boolean;
      } | null>(null);
    const playback = useRef({
        elapsed: 0,
        active: true,
        progress: {} as Record<number, number>,
      }),
      idleClock = useRef(0),
      frame = useRef(0),
      zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const expandContext = useRef<{
      context: SpatialCheckpoint;
      history: SpatialCheckpoint[];
      future: SpatialCheckpoint[];
    } | null>(null);
    const hovered = useRef<NodeKey | null>(null),
      keyboardFocus = useRef<NodeKey | null>(null),
      frameSamples = useRef<number[]>([]),
      badSince = useRef<number | null>(null);
    if (!previewController.current)
      previewController.current = new DelayedPreview<NodeKey>(
        (key) => {
          previewKey.current = key;
          hovered.current = key;
          setPreview(key);
        },
        () => !live.current.researchOpen && !pointer.current,
      );
    const currentPath = testPaths.find((p) => p.id === pathId)!;
    const reduced = Boolean(props.reducedMotion || systemReduced);
    const live = useRef({
      selected,
      pathId,
      held,
      filtered,
      expanded,
      reduced,
      paused: !!props.paused,
      researchOpen: !!props.researchOpen,
      performanceReduced,
    });
    live.current = {
      selected,
      pathId,
      held,
      filtered,
      expanded,
      reduced,
      paused: !!props.paused,
      researchOpen: !!props.researchOpen,
      performanceReduced,
    };
    const propsRef = useRef(props);
    propsRef.current = props;
    const syncCounts = () =>
      setCounts({
        past: history.current.length,
        future: future.current.length,
      });
    const stopCamera = () => {
      Object.values(camera.current).forEach((s) => settle(s, s.value));
    };
    const pausePath = () => {
      if (playback.current.active) {
        playback.current.active = false;
        setPlayState("paused");
      }
    };
    function capture(label = "探索现场"): SpatialCheckpoint {
      return {
        label,
        camera: {
          x: camera.current.x.value,
          y: camera.current.y.value,
          z: camera.current.z.value,
        },
        held: live.current.held,
        selected: live.current.selected,
        pathId: live.current.pathId,
        filtered: live.current.filtered,
        positions: Object.fromEntries(
          Object.entries(positions.current).map(([key, n]) => [
            key,
            { x: n.x, y: n.y, dx: n.dx, dy: n.dy },
          ]),
        ),
        progress: { ...playback.current.progress },
        elapsed: playback.current.elapsed,
        scroll: window.scrollY,
      };
    }
    function remember(label: string) {
      history.current.push(capture(label));
      if (history.current.length > 20) history.current.shift();
      future.current = [];
      syncCounts();
    }
    function moveCamera(x: number, y: number, z: number, animate = true) {
      const c = camera.current;
      if (!animate || live.current.reduced || live.current.paused) {
        settle(c.x, x);
        settle(c.y, y);
        settle(c.z, z);
      } else {
        c.x.target = x;
        c.y.target = y;
        c.z.target = z;
      }
    }
    function restore(
      context: SpatialCheckpoint,
      animate = true,
      scroll = false,
    ) {
      stopCamera();
      pausePath();
      hovered.current = null;
      previewController.current?.clear();
      setSelected(context.selected);
      setPathId(context.pathId);
      setHeld(context.held);
      setFiltered(context.filtered);
      Object.assign(live.current, {
        selected: context.selected,
        pathId: context.pathId,
        held: context.held,
        filtered: context.filtered,
      });
      for (const [key, p] of Object.entries(context.positions))
        if (positions.current[key]) Object.assign(positions.current[key], p);
      playback.current = {
        elapsed: context.elapsed,
        active: false,
        progress: { ...context.progress },
      };
      setPlayState(
        Object.keys(context.progress).length ? "paused" : "complete",
      );
      moveCamera(context.camera.x, context.camera.y, context.camera.z, animate);
      propsRef.current.onFilterChange?.(context.filtered, context.selected);
      if (scroll) window.scrollTo({ top: context.scroll, behavior: "instant" });
    }
    function fit(keys: NodeKey[] = testNodes.map((n) => n.key)) {
      const next = fitCamera(
        keys.map((k) => positions.current[k]),
        viewport.current,
      );
      moveCamera(next.x, next.y, next.z);
    }
    function focusNode(key: NodeKey, explicit = false) {
      const n = positions.current[key],
        c = camera.current,
        z = explicit
          ? c.z.value
          : Math.max(c.z.value, Math.min(1.8, c.z.value * 1.15)),
        next = focusCamera(
          { x: n.x + n.dx, y: n.y + n.dy },
          z,
          viewport.current,
        );
      moveCamera(next.x, next.y, next.z);
    }
    function play(id: string, restart = true) {
      if (restart)
        playback.current = { elapsed: 0, active: true, progress: {} };
      else playback.current.active = true;
      if (live.current.reduced || live.current.paused) {
        playback.current.progress = Object.fromEntries(
          testPaths.find((p) => p.id === id)!.edges.map((i) => [i, 1]),
        );
        playback.current.active = false;
        setPlayState("complete");
      } else setPlayState("playing");
    }
    function clearFilter() {
      if (live.current.filtered) {
        setFiltered(false);
        live.current.filtered = false;
        propsRef.current.onFilterChange?.(false, live.current.selected);
        setNotice("研究对象已切换，已清除主动筛选。");
      }
    }
    function selectNode(key: NodeKey) {
      previewController.current?.clear();
      if (live.current.researchOpen || live.current.selected === key) return;
      remember(`选择节点 ${key}`);
      clearFilter();
      setSelected(key);
      live.current.selected = key;
      positions.current[key].scale.value = 0.94;
      positions.current[key].scale.target = 1;
      if (!live.current.held) focusNode(key);
    }
    function selectPath(id: string) {
      previewController.current?.clear();
      if (id === live.current.pathId) return;
      remember(`切换路径 · ${testPaths.find((p) => p.id === id)!.name}`);
      clearFilter();
      stopCamera();
      setPathId(id);
      live.current.pathId = id;
      if (!live.current.held) {
        const key = testPaths.find((p) => p.id === id)!.nodes[0];
        setSelected(key);
        live.current.selected = key;
        focusNode(key);
      }
      play(id);
    }
    function manualStart() {
      previewController.current?.clear();
      stopCamera();
      pausePath();
      setHeld(true);
      live.current.held = true;
    }
    function zoom(
      factor: number,
      anchor = { x: viewport.current.w / 2, y: viewport.current.h / 2 },
    ) {
      if (!zoomTimer.current) remember("缩放视角");
      manualStart();
      const c = camera.current,
        next = zoomCamera(
          { x: c.x.value, y: c.y.value, z: c.z.value },
          factor,
          anchor,
        );
      moveCamera(next.x, next.y, next.z, false);
      if (zoomTimer.current) clearTimeout(zoomTimer.current);
      zoomTimer.current = setTimeout(() => {
        zoomTimer.current = null;
      }, 300);
    }
    function pointerDown(e: ReactPointerEvent, key: NodeKey | null = null) {
      if (e.button !== 0 || live.current.researchOpen) return;
      stopCamera();
      pausePath();
      pointer.current = {
        id: e.pointerId,
        key,
        x: e.clientX,
        y: e.clientY,
        sx: e.clientX,
        sy: e.clientY,
        moved: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation();
    }
    function pointerMove(e: ReactPointerEvent) {
      const p = pointer.current;
      if (!p || p.id !== e.pointerId) return;
      const dx = e.clientX - p.x,
        dy = e.clientY - p.y;
      if (!p.moved && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 5) {
        remember(p.key ? `拖动节点 ${p.key}` : "平移画布");
        manualStart();
        p.moved = true;
      }
      if (p.moved) {
        if (p.key) {
          positions.current[p.key].x += dx / camera.current.z.value;
          positions.current[p.key].y += dy / camera.current.z.value;
        } else {
          settle(camera.current.x, camera.current.x.value + dx);
          settle(camera.current.y, camera.current.y.value + dy);
        }
      }
      p.x = e.clientX;
      p.y = e.clientY;
    }
    function pointerUp() {
      const p = pointer.current;
      pointer.current = null;
      if (p?.key && !p.moved) selectNode(p.key);
    }
    function back(forward = false) {
      const from = forward ? future : history,
        to = forward ? history : future,
        context = from.current.pop();
      if (!context) return;
      to.current.push(capture(forward ? "返回前一现场" : "返回后一现场"));
      restore(context);
      setHistoryOpen(false);
      syncCounts();
      setNotice("视角、位置、路径与筛选已恢复；路径不会自动重播。");
    }
    function overview(pathOnly = false) {
      remember(pathOnly ? "当前路径概览" : "全局概览");
      stopCamera();
      pausePath();
      fit(pathOnly ? currentPath.nodes : undefined);
    }
    function explicitFocus() {
      if (!selected) return;
      remember(`聚焦节点 ${selected}`);
      stopCamera();
      pausePath();
      focusNode(selected, true);
    }
    function expand() {
      if (!expanded) {
        expandContext.current = {
          context: capture("展开前现场"),
          history: [...history.current],
          future: [...future.current],
        };
        history.current = [];
        future.current = [];
        setExpanded(true);
        propsRef.current.onExpandedChange?.(true);
      } else {
        const saved = expandContext.current;
        if (saved) {
          restore(saved.context, false, false);
          history.current = saved.history;
          future.current = saved.future;
        }
        setExpanded(false);
        propsRef.current.onExpandedChange?.(false);
        expandContext.current = null;
        if (saved)
          requestAnimationFrame(() =>
            window.scrollTo({ top: saved.context.scroll, behavior: "instant" }),
          );
      }
      setHistoryOpen(false);
      syncCounts();
    }
    function reset() {
      previewController.current?.clear();
      stopCamera();
      positions.current = newPositions();
      history.current = [];
      future.current = [];
      playback.current = {
        elapsed: 0,
        active: !live.current.reduced,
        progress: {},
      };
      setSelected(null);
      setPathId("negative");
      setHeld(false);
      setFiltered(false);
      setExpanded(false);
      setHistoryOpen(false);
      setPlayState(live.current.reduced ? "complete" : "playing");
      Object.assign(live.current, {
        selected: null,
        pathId: "negative",
        held: false,
        filtered: false,
      });
      propsRef.current.onExpandedChange?.(false);
      propsRef.current.onFilterChange?.(false, null);
      syncCounts();
      settle(camera.current.x, 0);
      settle(camera.current.y, 0);
      settle(camera.current.z, 1);
    }
    useImperativeHandle(ref, () => ({
      captureContext: () => capture(),
      restoreContext: (context) => restore(context, false, true),
      reset,
      getDebugState: () => ({
        ...capture(),
        historyCount: history.current.length,
        forwardCount: future.current.length,
        pathActive: playback.current.active,
        expanded: live.current.expanded,
        performanceReduced: live.current.performanceReduced,
      }),
    }));
    useEffect(() => {
      reset();
    }, [props.eventId]); // Event identity invalidates every transient graph context.
    useEffect(() => {
      const media = matchMedia("(prefers-reduced-motion: reduce)"),
        change = () => setSystemReduced(media.matches);
      change();
      media.addEventListener("change", change);
      return () => media.removeEventListener("change", change);
    }, []);
    useEffect(() => {
      const el = canvas.current;
      if (!el) return;
      const observer = new ResizeObserver(([entry]) => {
        viewport.current = {
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        };
      });
      observer.observe(el);
      const wheel = (e: WheelEvent) => {
        if (live.current.researchOpen) return;
        e.preventDefault();
        const box = el.getBoundingClientRect();
        zoom(Math.exp(-Math.max(-120, Math.min(120, e.deltaY)) * 0.002), {
          x: e.clientX - box.left,
          y: e.clientY - box.top,
        });
      };
      el.addEventListener("wheel", wheel, { passive: false });
      return () => {
        observer.disconnect();
        el.removeEventListener("wheel", wheel);
      };
    }, []);
    useEffect(() => {
      const mapped = selected
        ? testCompanies
            .filter((c) => c.node_ids.includes(selected))
            .map((c) => c.id)
        : [];
      propsRef.current.onSelectionChange?.({
        nodeKey: selected,
        pathId,
        testCompanyIds: mapped,
        filtered,
      });
    }, [selected, pathId, filtered]);
    useEffect(() => {
      if (reduced) {
        stopCamera();
        playback.current.active = false;
        playback.current.progress = Object.fromEntries(
          currentPath.edges.map((i) => [i, 1]),
        );
        for (const p of Object.values(positions.current)) {
          p.dx = 0;
          p.dy = 0;
        }
        setPlayState("complete");
      }
    }, [reduced]);
    useEffect(() => {
      layoutMotion.current.target = expanded
        ? Math.max(650, window.innerHeight - 170)
        : 540;
    }, [expanded]);
    useEffect(() => {
      if (props.paused || props.researchOpen) {
        previewController.current?.clear();
        stopCamera();
        pausePath();
      }
    }, [props.paused, props.researchOpen]);
    useEffect(() => {
      if (!notice) return;
      const timer = setTimeout(() => setNotice(""), 3600);
      return () => clearTimeout(timer);
    }, [notice]);
    useEffect(() => {
      let last = performance.now();
      const tick = (now: number) => {
        const raw = now - last,
          dt = Math.min(0.032, raw / 1000);
        last = now;
        const st = live.current,
          c = camera.current,
          pb = playback.current,
          path = testPaths.find((p) => p.id === st.pathId)!;
        if (!document.hidden) {
          if (card.current) {
            if (window.innerWidth > 900) {
              if (st.reduced || st.paused) settle(layoutMotion.current);
              else advance(layoutMotion.current, dt);
              card.current.style.height = `${layoutMotion.current.value}px`;
            } else card.current.style.removeProperty("height");
            card.current.dataset.camera = JSON.stringify({
              x: c.x.value,
              y: c.y.value,
              z: c.z.value,
            });
            card.current.dataset.pathProgress = JSON.stringify(pb.progress);
          }
          if (!st.paused && !st.researchOpen && !st.reduced) {
            idleClock.current += dt;
            Object.values(c).forEach((s) => advance(s, dt));
          }
          if (
            !st.paused &&
            !st.researchOpen &&
            !st.reduced &&
            !st.performanceReduced
          ) {
            frameSamples.current.push(raw);
            if (frameSamples.current.length > 90) frameSamples.current.shift();
            const slow =
              frameSamples.current.length === 90 &&
              frameSamples.current.filter((t) => t > 40).length > 18;
            if (slow) {
              badSince.current ??= now;
              if (now - badSince.current > 2000) setPerformanceReduced(true);
            } else badSince.current = null;
          }
          testNodes.forEach((node, i) => {
            const n = positions.current[node.key],
              stable =
                st.selected === node.key ||
                hovered.current === node.key ||
                keyboardFocus.current === node.key ||
                pointer.current?.key === node.key;
            if (
              !st.paused &&
              !st.researchOpen &&
              !st.reduced &&
              !st.performanceReduced &&
              !stable
            ) {
              const t = idleClock.current;
              n.idleX.target =
                1.6 * Math.sin((t * 2 * Math.PI) / (8 + (i % 5)) + i);
              n.idleY.target =
                1.05 * Math.cos((t * 2 * Math.PI) / (10 + (i % 3)) + i * 0.7);
              n.dx = advance(n.idleX, dt) / Math.max(1, c.z.value);
              n.dy = advance(n.idleY, dt) / Math.max(1, c.z.value);
              const radial = Math.hypot(n.dx, n.dy) * c.z.value;
              if (radial > 2) {
                n.dx *= 2 / radial;
                n.dy *= 2 / radial;
              }
            }
            if (!st.paused && !st.reduced) advance(n.scale, dt);
            else settle(n.scale, 1);
            svg.current
              ?.querySelector(`[data-node="${node.key}"]`)
              ?.setAttribute(
                "transform",
                `translate(${n.x + n.dx} ${n.y + n.dy})`,
              );
            svg.current
              ?.querySelector(`[data-node="${node.key}"] .sg-emphasis`)
              ?.setAttribute("transform", `scale(${n.scale.value})`);
          });
          if (pb.active && !st.paused && !st.researchOpen && !st.reduced) {
            pb.elapsed += dt * 1000;
            path.edges.forEach((edge, i) => {
              const u = (pb.elapsed - i * 460) / 360;
              if (u >= 0)
                pb.progress[edge] = st.performanceReduced
                  ? u >= 1
                    ? 1
                    : 0
                  : smooth(u);
            });
            if (pb.elapsed >= path.edges.length * 460 - 100) {
              pb.active = false;
              setPlayState("complete");
            }
          }
          testEdges.forEach((edge, i) => {
            const a = positions.current[edge.source],
              b = positions.current[edge.target],
              d = curve(
                { x: a.x + a.dx, y: a.y + a.dy },
                { x: b.x + b.dx, y: b.y + b.dy },
              );
            svg.current
              ?.querySelector(`[data-edge="${i}"]`)
              ?.setAttribute("d", d);
            svg.current
              ?.querySelector(`[data-pattern="${i}"]`)
              ?.setAttribute("d", d);
            const high = svg.current?.querySelector<SVGPathElement>(
              `[data-highlight="${i}"]`,
            );
            if (high) {
              high.setAttribute("d", d);
              high.style.strokeDashoffset = String(
                1000 * (1 - (pb.progress[i] || 0)),
              );
              high.style.opacity = (pb.progress[i] || 0) > 0 ? "1" : "0";
            }
            const mask = svg.current?.querySelector(`[data-mask="${i}"]`);
            if (mask) {
              mask.setAttribute("x", String(Math.min(a.x, b.x) - 50));
              mask.setAttribute("y", String(Math.min(a.y, b.y) - 50));
              mask.setAttribute("width", String(Math.abs(b.x - a.x) + 100));
              mask.setAttribute("height", String(Math.abs(b.y - a.y) + 100));
            }
          });
          world.current?.setAttribute(
            "transform",
            `translate(${c.x.value} ${c.y.value}) scale(${c.z.value})`,
          );
          let outside = false;
          const popupKey = previewKey.current || st.selected;
          if (popupKey) {
            const n = positions.current[popupKey],
              x = (n.x + n.dx) * c.z.value + c.x.value,
              y = (n.y + n.dy) * c.z.value + c.y.value;
            outside =
              x < 27 ||
              x > viewport.current.w - 27 ||
              y < 27 ||
              y > viewport.current.h - 50;
            if (popover.current) {
              const px = Math.max(
                  12,
                  Math.min(
                    viewport.current.w - 260,
                    x - (popupKey === "B" ? 224 : 124),
                  ),
                ),
                py = Math.max(
                  36,
                  Math.min(
                    viewport.current.h - 114,
                    y > viewport.current.h - 140 ? y - 144 : y + 65 * c.z.value,
                  ),
                );
              popover.current.style.transform = `translate(${px}px,${py}px)`;
              popover.current.style.visibility =
                outside || st.researchOpen ? "hidden" : "visible";
            }
          }
          if (st.selected) {
            const n = positions.current[st.selected],
              x = (n.x + n.dx) * c.z.value + c.x.value,
              y = (n.y + n.dy) * c.z.value + c.y.value;
            outside =
              x < 27 ||
              x > viewport.current.w - 27 ||
              y < 27 ||
              y > viewport.current.h - 50;
          }
          if (status.current)
            status.current.textContent = `${Math.round(c.z.value * 100)}% · ${st.held ? "保持视角" : "自动聚焦"}${pb.active ? " · 路径渐进显现" : ""}${outside ? " · 当前节点在视窗外，请按需聚焦" : ""}${st.performanceReduced ? " · 性能降级" : ""}`;
        }
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(frame.current);
        if (zoomTimer.current) clearTimeout(zoomTimer.current);
        previewController.current?.dispose();
      };
    }, []);
    const mapped = selected
      ? testCompanies.filter((c) => c.node_ids.includes(selected))
      : [];
    const activeKey = preview || selected,
      previewMapped = activeKey
        ? testCompanies.filter((c) => c.node_ids.includes(activeKey))
        : [];
    return (
      <section
        id="graph"
        ref={card}
        data-view-mode={held ? "held" : "auto"}
        data-selected={selected || ""}
        data-preview={preview || ""}
        data-path={pathId}
        data-history-count={counts.past}
        data-forward-count={counts.future}
        className={`sg-card ${expanded ? "sg-expanded" : ""}`}
        aria-label="TEST 产业关系空间探索"
      >
        <div className="sg-heading">
          <h2>产业关系图谱</h2>
          <span className="sg-badge">TEST · 独立演示场景</span>
          <div className="sg-tools">
            <button onClick={() => overview()}>全局概览</button>
            <button onClick={expand}>
              {expanded ? "收起图谱" : "展开图谱"}
            </button>
          </div>
        </div>
        <div className="sg-tabs">
          <strong>空间探索</strong>
          <div className="sg-playback">
            <span>{currentPath.name} · TEST</span>
            <button
              onClick={() => {
                if (playState === "playing") pausePath();
                else play(pathId, false);
              }}
              disabled={reduced || !!props.paused || playState === "complete"}
            >
              {playState === "playing" ? "暂停路径" : "继续路径"}
            </button>
            <button onClick={() => play(pathId)}>重播路径</button>
            <button
              onClick={() => {
                remember(held ? "恢复自动聚焦" : "保持当前视角");
                setHeld(!held);
              }}
            >
              {" "}
              {held ? "恢复自动聚焦" : "保持视角"}
            </button>
            <small>
              {reduced
                ? "Reduced Motion · 静态等价信息"
                : props.paused
                  ? "已暂停全部动效"
                  : "手动操作优先于相机动画"}
            </small>
          </div>
          <div className="sg-legend">
            {Object.entries(directionNames).map(([key, name]) => (
              <span
                key={key}
                style={{
                  color: directionColors[key as keyof typeof directionColors],
                }}
              >
                <i className={key === "uncertain" ? "sg-dashed" : ""} />
                {name}
              </span>
            ))}
          </div>
        </div>
        <div className="sg-layout">
          <aside className="sg-navigation">
            <div className="sg-nav-title">
              <h3>路径导航</h3>
              <button onClick={() => overview(true)}>路径概览</button>
            </div>
            <small className="sg-test-note">TEST · 仅视觉测试</small>
            <div className="sg-paths">
              {testPaths.map((p) => (
                <button
                  key={p.id}
                  className={p.id === pathId ? "sg-active" : ""}
                  onClick={() => selectPath(p.id)}
                  aria-pressed={p.id === pathId}
                >
                  <span style={{ color: directionColors[p.direction] }}>
                    {p.name}
                  </span>
                  <small>{p.nodes.join(" → ")}</small>
                </button>
              ))}
            </div>
            <div className="sg-current">
              <small>当前焦点</small>
              <strong>{selected ? `节点 ${selected}` : "未选择节点"}</strong>
            </div>
            <div className="sg-controls">
              <div>
                <button
                  onClick={() => back()}
                  disabled={!counts.past}
                  aria-label="返回上一视角"
                >
                  返回 {counts.past || ""}
                </button>
                <button onClick={() => back(true)} disabled={!counts.future}>
                  前进
                </button>
                <button
                  aria-expanded={historyOpen}
                  onClick={() => setHistoryOpen(!historyOpen)}
                >
                  历史
                </button>
              </div>
              <div>
                <button disabled={!selected} onClick={explicitFocus}>
                  聚焦节点
                </button>
                <button
                  disabled={expanded}
                  title={expanded ? "收起图谱后查看公司比较" : undefined}
                  onClick={() => {
                    stopCamera();
                    pausePath();
                    props.onCompanyCompare?.(capture("图谱研究现场"));
                  }}
                >
                  公司比较
                </button>
              </div>
              <button
                className="sg-primary"
                disabled={!selected}
                onClick={() => {
                  if (selected) {
                    previewController.current?.clear();
                    stopCamera();
                    pausePath();
                    props.onNodeResearch?.(selected, capture("图谱研究现场"));
                  }
                }}
              >
                研究当前节点
              </button>
            </div>
            {historyOpen && (
              <div className="sg-history">
                <div>
                  <strong>探索历史</strong>
                  <button onClick={() => setHistoryOpen(false)}>关闭</button>
                </div>
                <p>恢复现场，不自动重播路径。</p>
                {!history.current.length && (
                  <p>平移、缩放或选择后留下可返回的现场。</p>
                )}
                {history.current
                  .map((entry, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        future.current.push(capture("返回后一现场"));
                        for (let j = history.current.length - 1; j > i; j--)
                          future.current.push(history.current[j]);
                        history.current = history.current.slice(0, i);
                        restore(entry);
                        syncCounts();
                        setHistoryOpen(false);
                      }}
                    >
                      <strong>{entry.label}</strong>
                      <small>
                        {entry.selected ? `节点 ${entry.selected}` : "未选节点"}{" "}
                        · {Math.round(entry.camera.z * 100)}%
                        {entry.filtered ? " · 主动筛选" : ""}
                      </small>
                    </button>
                  ))
                  .reverse()}
              </div>
            )}
          </aside>
          <div className="sg-canvas" ref={canvas}>
            <small className="sg-canvas-note">
              TEST 网络 · 不关联业务 Mock 公司、评分或证据
            </small>
            <svg
              ref={svg}
              className="sg-network"
              role="group"
              aria-label="可交互 TEST 图谱"
              tabIndex={0}
              onPointerDown={(e) => pointerDown(e)}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={() => {
                pointer.current = null;
              }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (
                  ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key,
                  )
                ) {
                  e.preventDefault();
                  remember("键盘平移");
                  manualStart();
                  settle(
                    camera.current.x,
                    camera.current.x.value +
                      ((
                        { ArrowLeft: 40, ArrowRight: -40 } as Record<
                          string,
                          number
                        >
                      )[e.key] || 0),
                  );
                  settle(
                    camera.current.y,
                    camera.current.y.value +
                      ((
                        { ArrowUp: 40, ArrowDown: -40 } as Record<
                          string,
                          number
                        >
                      )[e.key] || 0),
                  );
                }
                if (e.key === "+" || e.key === "=") {
                  e.preventDefault();
                  zoom(1.15);
                }
                if (e.key === "-") {
                  e.preventDefault();
                  zoom(1 / 1.15);
                }
              }}
            >
              <defs>
                {Object.entries(directionColors).map(([key, color]) => (
                  <marker
                    key={key}
                    id={`${prefix}-arrow-${key}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M0 0 L8 4 L0 8 Z" fill={color} />
                  </marker>
                ))}
                {testEdges.map(
                  (edge, i) =>
                    edge.direction === "uncertain" && (
                      <mask
                        key={i}
                        id={`${prefix}-reveal-${i}`}
                        data-mask={i}
                        maskUnits="userSpaceOnUse"
                      >
                        <path
                          data-highlight={i}
                          d={curve(
                            positions.current[edge.source],
                            positions.current[edge.target],
                          )}
                          pathLength="1000"
                          stroke="white"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray="1000"
                          strokeDashoffset="1000"
                        />
                      </mask>
                    ),
                )}
              </defs>
              <g ref={world}>
                {testEdges.map((edge, i) => (
                  <g key={edge.id}>
                    <path
                      data-edge={i}
                      d={curve(
                        positions.current[edge.source],
                        positions.current[edge.target],
                      )}
                      fill="none"
                      stroke={directionColors[edge.direction]}
                      strokeWidth={currentPath.edges.includes(i) ? 1.6 : 1.4}
                      opacity=".76"
                      strokeDasharray={
                        edge.direction === "uncertain" ? "5 4" : undefined
                      }
                      markerEnd={`url(#${prefix}-arrow-${edge.direction})`}
                    />
                    {edge.direction === "uncertain" ? (
                      <path
                        data-pattern={i}
                        d={curve(
                          positions.current[edge.source],
                          positions.current[edge.target],
                        )}
                        fill="none"
                        stroke={directionColors[edge.direction]}
                        strokeWidth="2.5"
                        strokeDasharray="5 4"
                        mask={`url(#${prefix}-reveal-${i})`}
                      />
                    ) : (
                      <path
                        data-highlight={i}
                        d={curve(
                          positions.current[edge.source],
                          positions.current[edge.target],
                        )}
                        fill="none"
                        stroke={directionColors[edge.direction]}
                        strokeWidth="2.5"
                        pathLength="1000"
                        strokeDasharray="1000"
                        strokeDashoffset="1000"
                      />
                    )}
                  </g>
                ))}
                <text
                  x="337"
                  y="157"
                  className="sg-edge-label"
                  fill={directionColors.negative}
                >
                  负向 · TEST
                </text>
                <text
                  x="377"
                  y="261"
                  className="sg-edge-label"
                  fill={directionColors.positive}
                >
                  正向 · TEST
                </text>
                {testNodes.map((n) => (
                  <g
                    key={n.key}
                    data-node={n.key}
                    transform={`translate(${n.x} ${n.y})`}
                    className="sg-node"
                    role="button"
                    tabIndex={0}
                    aria-label={`TEST ${n.label}${selected === n.key ? "，当前选中" : ""}`}
                    aria-pressed={selected === n.key}
                    onPointerDown={(e) => pointerDown(e, n.key)}
                    onPointerEnter={() => {
                      hovered.current = n.key;
                      previewController.current?.enter(n.key);
                    }}
                    onPointerLeave={() => {
                      previewController.current?.leave();
                    }}
                    onFocus={() => {
                      keyboardFocus.current = n.key;
                    }}
                    onBlur={() => {
                      keyboardFocus.current = null;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        selectNode(n.key);
                      }
                    }}
                  >
                    <g className="sg-emphasis">
                      {selected === n.key && (
                        <circle r="34" className="sg-halo" />
                      )}
                      <circle
                        r="27"
                        className={`sg-category ${n.category === "desktop" ? "sg-teal" : ""} ${selected === n.key ? "sg-selected" : currentPath.nodes.includes(n.key) ? "sg-member" : ""}`}
                      />
                    </g>
                    <image
                      href={
                        n.key === "D"
                          ? graphAssets.desktopTeal
                          : graphAssets[n.category]
                      }
                      x="-10"
                      y="-10"
                      width="20"
                      height="20"
                    />
                    <text
                      y="50"
                      textAnchor="middle"
                      className={selected === n.key ? "sg-selected-label" : ""}
                    >
                      {n.label}
                      {selected === n.key ? " · 当前" : ""}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
            {activeKey && (
              <div
                ref={popover}
                className="sg-popover"
                onPointerEnter={() => {
                  previewController.current?.bridge();
                  hovered.current = activeKey;
                }}
                onPointerLeave={() => previewController.current?.leave()}
                onFocus={() => {
                  previewController.current?.bridge();
                  keyboardFocus.current = activeKey;
                }}
                onBlur={() => {
                  keyboardFocus.current = null;
                  previewController.current?.leave();
                }}
              >
                <strong>
                  {preview && preview !== selected ? "预览节点" : "当前节点"} ·{" "}
                  {testNodes.find((n) => n.key === activeKey)!.label} · TEST
                </strong>
                <p>合成节点 · {previewMapped.length} 家 TEST 公司</p>
                <button
                  onClick={() => {
                    if (activeKey !== selected) selectNode(activeKey);
                    previewController.current?.clear();
                    stopCamera();
                    pausePath();
                    props.onNodeResearch?.(activeKey, capture("图谱研究现场"));
                  }}
                >
                  查看节点详情 →
                </button>
              </div>
            )}
            <div className="sg-camera-tools">
              <button onClick={() => zoom(1.15)} aria-label="放大图谱">
                ＋
              </button>
              <button onClick={() => zoom(1 / 1.15)} aria-label="缩小图谱">
                −
              </button>
            </div>
            <span ref={status} className="sg-status">
              100% · 自动聚焦
            </span>
          </div>
        </div>
        <div className="sg-footer">
          <span>
            {selected
              ? `TEST 节点 ${selected} · 已高亮 ${mapped.length} 家测试公司${filtered ? " · 主动筛选中" : " · 尚未筛选"}`
              : "10 个 TEST 节点 / 9 条合成关系 · 与业务报告隔离"}
          </span>
          <button
            disabled={!props.testCompanyMode || !selected || !mapped.length}
            onClick={() => {
              remember(filtered ? "取消主动筛选" : "筛选关联 TEST 公司");
              setFiltered(!filtered);
              props.onFilterChange?.(!filtered, selected);
            }}
          >
            {!props.testCompanyMode
              ? "业务节点公司映射 · 数据不足"
              : filtered
                ? "取消主动筛选"
                : `筛选关联 TEST 公司${selected ? ` · ${mapped.length}` : ""}`}
          </button>
        </div>

        <p className="sg-notice" role="status">
          {notice}
        </p>
      </section>
    );
  },
);
