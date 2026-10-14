import { useEffect, useId, useRef, useState } from "react";
import type { PathView } from "../adapters/types";
import { businessEdges } from "./businessGraph";
import { directionColors, directionNames } from "./spatial/data";
import "./spatial/graph.css";
import "./businessGraph.css";
type Camera = { x: number; y: number; z: number };
export function BusinessGraph({
  paths,
  pathId,
  nodeId,
  onSelect,
  onResearch,
  onTest,
  onExpandedChange,
}: {
  paths: PathView[] | null;
  pathId: string | null;
  nodeId: string | null;
  onSelect: (path: string, node: string | null) => void;
  onResearch: (path: string, node: string) => void;
  onTest: () => void;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, z: 1 });
  const [held, setHeld] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandContext = useRef<{
    camera: Camera;
    held: boolean;
    path: string | null;
    node: string | null;
    scroll: number;
    history: Camera[];
  } | null>(null);
  function toggleExpanded() {
    if (!expanded)
      expandContext.current = {
        camera,
        held,
        path: pathId,
        node: nodeId,
        scroll: window.scrollY,
        history: [...history.current],
      };
    else if (expandContext.current) {
      const saved = expandContext.current;
      setCamera(saved.camera);
      setHeld(saved.held);
      history.current = saved.history;
      if (saved.path) onSelect(saved.path, saved.node);
      requestAnimationFrame(() =>
        window.scrollTo({ top: saved.scroll, behavior: "instant" }),
      );
    }
    setExpanded(!expanded);
    onExpandedChange(!expanded);
  }
  const history = useRef<Camera[]>([]);
  const pointer = useRef<{
    x: number;
    y: number;
    camera: Camera;
    moved: boolean;
  } | null>(null);
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = canvas.current;
    const preventPageScroll = (event: WheelEvent) => event.preventDefault();
    target?.addEventListener("wheel", preventPageScroll, { passive: false });
    return () => target?.removeEventListener("wheel", preventPageScroll);
  }, []);
  const marker = useId().replace(/:/g, "");
  const path = paths?.find((p) => p.path_id === pathId) ?? paths?.[0];
  const edges = path ? businessEdges(path) : null;
  const nodes = path?.node_ids ?? [];
  const color =
    directionColors[path?.impact_direction as keyof typeof directionColors] ??
    "#58687E";
  const label =
    directionNames[path?.impact_direction as keyof typeof directionNames] ??
    "方向数据不足";
  const point = (i: number) => ({
    x: 90 + i * (680 / Math.max(1, nodes.length - 1)),
    y: 175,
  });
  function move(next: Camera) {
    history.current.push(camera);
    history.current = history.current.slice(-20);
    setCamera(next);
  }
  function focus(i: number) {
    move({
      ...camera,
      x: 430 - point(i).x * camera.z,
      y: 194 - point(i).y * camera.z,
    });
  }
  return (
    <section
      id="graph"
      className={`sg-card business-graph ${expanded ? "sg-expanded" : ""}`}
      style={
        expanded
          ? { height: Math.max(650, window.innerHeight - 170) }
          : undefined
      }
      aria-label="业务 ID 图谱"
      data-selected={nodeId ?? ""}
      data-path={path?.path_id ?? ""}
      data-view-mode={held ? "held" : "auto"}
      data-camera={JSON.stringify(camera)}
    >
      <div className="sg-heading">
        <h2>产业关系探索</h2>
        <span className="sg-badge">报告业务路径 · ID 视图</span>
        <div className="sg-tools">
          <button onClick={toggleExpanded}>
            {expanded ? "收起图谱" : "展开图谱"}
          </button>
          <button disabled={expanded} onClick={onTest}>
            打开独立 TEST 图谱
          </button>
        </div>
      </div>
      <div className="sg-tabs">
        <strong>当前报告</strong>
        <span style={{ color }}>
          {label} · 规则 {path?.rule_id ?? "数据不足"}
        </span>
      </div>
      <div className="sg-layout">
        <nav className="sg-navigation" aria-label="业务路径选择">
          <div className="sg-nav-title">
            <h3>传导路径</h3>
          </div>
          <div className="bg-paths">
            {paths?.map((p) => (
              <button
                key={p.path_id}
                className={path?.path_id === p.path_id ? "active" : ""}
                onClick={() => onSelect(p.path_id, null)}
              >
                {p.path_id}
                <small>
                  {directionNames[
                    p.impact_direction as keyof typeof directionNames
                  ] ?? "方向数据不足"}
                </small>
              </button>
            ))}
          </div>
          <p className="bg-note">
            名称、类别、规则正文及公司映射：数据不足。连线依据契约中的相邻节点关系。
          </p>
        </nav>
        <div
          className="sg-canvas bg-canvas"
          ref={canvas}
          onWheel={(e) => {
            setHeld(true);
            move({
              ...camera,
              z: Math.min(
                2,
                Math.max(0.5, camera.z * (e.deltaY > 0 ? 0.9 : 1.1)),
              ),
            });
          }}
          onPointerDown={(e) => {
            if ((e.target as Element).closest("button, [data-business-node]"))
              return;
            e.currentTarget.setPointerCapture(e.pointerId);
            pointer.current = {
              x: e.clientX,
              y: e.clientY,
              camera,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const p = pointer.current;
            if (!p) return;
            if (!p.moved) history.current.push(p.camera);
            p.moved = true;
            setHeld(true);
            setCamera({
              ...p.camera,
              x: p.camera.x + e.clientX - p.x,
              y: p.camera.y + e.clientY - p.y,
            });
          }}
          onPointerUp={() => {
            pointer.current = null;
          }}
          onPointerCancel={() => {
            pointer.current = null;
          }}
        >
          {!path ? (
            <p className="bg-empty">
              {paths === null ? "路径集合 · 数据不足" : "暂无业务路径"}
            </p>
          ) : !edges ? (
            <p className="bg-empty">
              相邻关系数量不匹配或字段缺失 · 数据不足，未绘制连线
            </p>
          ) : (
            <svg viewBox="0 0 860 388" aria-label="业务路径相邻节点关系">
              <defs>
                <marker
                  id={marker}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                </marker>
              </defs>
              <g
                transform={`translate(${camera.x} ${camera.y}) scale(${camera.z})`}
              >
                {edges.map((edge, i) => {
                  const a = point(i),
                    b = point(i + 1);
                  return (
                    <g key={`${edge.id}:${i}`}>
                      <path
                        data-business-edge={edge.id}
                        data-source={edge.source}
                        data-target={edge.target}
                        d={`M ${a.x + 29} ${a.y} C ${a.x + 85} ${a.y - 40}, ${b.x - 85} ${b.y - 40}, ${b.x - 31} ${b.y}`}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeDasharray={
                          path.impact_direction === "uncertain"
                            ? "6 5"
                            : undefined
                        }
                        markerEnd={`url(#${marker})`}
                      />
                      <text
                        x={(a.x + b.x) / 2}
                        y={a.y - 42}
                        textAnchor="middle"
                        className="bg-relation"
                      >
                        {edge.id}
                      </text>
                    </g>
                  );
                })}
                {nodes.map((id, i) => {
                  const p = point(i);
                  const select = () => {
                    onSelect(path.path_id, id);
                    if (!held) focus(i);
                  };
                  return (
                    <g
                      key={`${id}:${i}`}
                      data-business-node={id}
                      transform={`translate(${p.x} ${p.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`业务节点 ${id}`}
                      onClick={select}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          select();
                        }
                      }}
                    >
                      <circle
                        r={nodeId === id ? 35 : 30}
                        fill={nodeId === id ? "#3569DD29" : "#EBF0FC"}
                      />
                      <circle
                        r="27"
                        fill="white"
                        stroke={nodeId === id ? "#3569DD" : "#AEBFDA"}
                        strokeWidth={nodeId === id ? 2.5 : 1.2}
                      />
                      <text
                        textAnchor="middle"
                        y="5"
                        fill="#58687E"
                        fontSize="14"
                      >
                        ID
                      </text>
                      <text
                        textAnchor="middle"
                        y="52"
                        className="bg-node-label"
                      >
                        {id}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
          <div className="bg-controls">
            <button
              onClick={() => {
                setHeld(true);
                move({ ...camera, z: Math.max(0.5, camera.z - 0.1) });
              }}
            >
              −
            </button>
            <span>{Math.round(camera.z * 100)}%</span>
            <button
              onClick={() => {
                setHeld(true);
                move({ ...camera, z: Math.min(2, camera.z + 0.1) });
              }}
            >
              ＋
            </button>
            <button
              disabled={!nodeId || !edges}
              onClick={() => focus(nodes.indexOf(nodeId!))}
            >
              聚焦节点
            </button>
            <button onClick={() => move({ x: 0, y: 0, z: 1 })}>全局复位</button>
            <button
              disabled={!history.current.length}
              onClick={() => {
                const previous = history.current.pop();
                if (previous) setCamera(previous);
              }}
            >
              视角返回
            </button>
          </div>
          {nodeId && path && (
            <div className="bg-popover">
              <strong>{nodeId}</strong>
              <p>名称与公司映射 · 数据不足</p>
              <button onClick={() => onResearch(path.path_id, nodeId)}>
                查看规则与证据
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-footer">
        {held
          ? "保持视角 · 选择节点不移动相机"
          : "自动聚焦 · 平移或缩放后保持视角"}{" "}
        · 公司表保留实际报告，未推断节点映射
      </div>
    </section>
  );
}
