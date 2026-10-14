import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { advance } from "./spatial/motion";
export interface DrawerItem {
  type: "node" | "company" | "evidence" | "path" | "sources";
  key: string;
  scope: "business" | "test";
}
interface Props {
  items: DrawerItem[];
  children: ReactNode;
  shell: RefObject<HTMLDivElement | null>;
  reduced: boolean;
  onClose: () => void;
  onBack: () => void;
  onReturn: () => void;
}
export function DrawerHost({
  items,
  children,
  shell,
  reduced,
  onClose,
  onBack,
  onReturn,
}: Props) {
  const panel = useRef<HTMLElement>(null),
    body = useRef<HTMLDivElement>(null),
    memory = useRef(new Map<string, number>()),
    opener = useRef<HTMLElement | null>(document.activeElement as HTMLElement),
    [closing, setClosing] = useState(false);
  const item = items.at(-1)!;
  const signature = `${item.scope}:${item.type}:${item.key}`;
  const close = () => setClosing(true);
  useEffect(() => {
    shell.current?.setAttribute("inert", "");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      shell.current?.removeAttribute("inert");
      document.body.style.overflow = overflow;
      if (opener.current?.isConnected)
        opener.current.focus({ preventScroll: true });
    };
  }, [shell]);
  useLayoutEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = memory.current.get(signature) ?? 0;
    panel.current
      ?.querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  }, [signature]);
  useEffect(() => {
    const frame = {
      value: closing ? 0 : 480,
      target: closing ? 480 : 0,
      velocity: 0,
      k: 120,
      c: 18,
    };
    let id = 0,
      last = performance.now(),
      elapsed = 0;
    function tick(now: number) {
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const x = reduced ? frame.target : advance(frame, dt);
      if (panel.current) panel.current.style.transform = `translateX(${x}px)`;
      if (
        closing &&
        (reduced ||
          (Math.abs(x - 480) < 0.1 && Math.abs(frame.velocity) < 0.1) ||
          elapsed > 2)
      ) {
        onClose();
        return;
      }
      if (
        !reduced &&
        (Math.abs(x - frame.target) > 0.005 || Math.abs(frame.velocity) > 0.01)
      )
        id = requestAnimationFrame(tick);
    }
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [closing, reduced, onClose]);
  // Approved drawer Spring is handled by the runtime; the same host remains mounted for nested reading.
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setClosing(true);
      }
      if (e.key === "Tab") {
        const options = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,select,[tabindex="0"]',
          ) ?? [],
        );
        const first = options[0],
          last = options.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
  return (
    <div className={`modal-layer ${reduced ? "reduced" : ""}`}>
      <div className="modal-backdrop" onClick={close} />
      <aside
        className="drawer"
        ref={panel}
        onClickCapture={() => {
          if (body.current)
            memory.current.set(signature, body.current.scrollTop);
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header className="drawer-heading">
          {items.length > 1 && (
            <button className="outline" onClick={onBack}>
              返回
            </button>
          )}
          <h2 id="drawer-title">
            {
              {
                node: "节点研究",
                company: "公司研究",
                evidence: "证据追溯",
                path: "业务路径",
                sources: "数据来源",
              }[item.type]
            }
          </h2>
          <button className="outline" onClick={close} aria-label="关闭抽屉">
            关闭
          </button>
        </header>
        <div className="drawer-body" ref={body}>
          {children}
        </div>
        <footer className="drawer-footer">
          <button className="outline" onClick={onReturn}>
            返回图谱现场
          </button>
          <small>保留视角、选择与阅读位置</small>
        </footer>
      </aside>
    </div>
  );
}
