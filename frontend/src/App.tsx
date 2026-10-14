import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createAnalysisAdapter,
  LatestRequestGuard,
  sortCompanies,
  safeSourceUrl,
  type DataMode,
  type ReportView,
  type EventView,
} from "./adapters";
import {
  SpatialGraph,
  type SpatialGraphHandle,
  type SpatialCheckpoint,
  type SpatialSelection,
} from "./components/SpatialGraph";
import {
  testCompanies,
  testEvidence,
  testNodes,
  type NodeKey,
} from "./components/spatial/data";
import { DrawerHost, type DrawerItem } from "./components/DrawerHost";
const missing = "数据不足";
const value = (v: unknown): string =>
  v === null || v === undefined || v === "" ? missing : String(v);
const score = (v: number | null) => (v === null ? missing : v.toFixed(2));
const direction = (v: string | null) =>
  ({
    positive: "正向",
    negative: "负向",
    neutral: "中性",
    uncertain: "不确定",
  })[v ?? ""] ?? (v ? `未知方向 · ${v}` : "方向数据不足");
const verification = (v: string | null) =>
  ({ verified: "已核验", pending_verification: "待核验", mock: "Mock · 模拟" })[
    v ?? ""
  ] ?? (v ? `未知状态 · ${v}` : "核验状态数据不足");
const risk = (r: string) =>
  ({
    mock_data: "Mock 样例",
    "demand-elasticity-unknown": "需求弹性未知",
    "cost-pass-through-unknown": "成本传导未知",
  })[r] ?? r;
function Badge({
  children,
  kind = "blue",
}: {
  children: ReactNode;
  kind?: string;
}) {
  return <span className={`badge ${kind}`}>{children}</span>;
}
export function App() {
  const [mode, setMode] = useState<DataMode>("api"),
    [events, setEvents] = useState<EventView[]>([]),
    [eventError, setEventError] = useState(""),
    [eventId, setEventId] = useState(""),
    [phase, setPhase] = useState<"entry" | "loading" | "ready" | "error">(
      "entry",
    ),
    [error, setError] = useState(""),
    [report, setReport] = useState<ReportView | null>(null);
  const [items, setItems] = useState<DrawerItem[]>([]),
    [ascending, setAscending] = useState(false),
    [tab, setTab] = useState<"business" | "test">("business"),
    [selection, setSelection] = useState<SpatialSelection | null>(null),
    [expanded, setExpanded] = useState(false),
    [reduce, setReduce] = useState(false),
    [systemReduce, setSystemReduce] = useState(
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [paused, setPaused] = useState(false),
    [businessPath, setBusinessPath] = useState<string | null>(null),
    [businessNode, setBusinessNode] = useState<string | null>(null);
  const shell = useRef<HTMLDivElement>(null),
    graph = useRef<SpatialGraphHandle>(null),
    request = useRef(new LatestRequestGuard()),
    checkpoint = useRef<SpatialCheckpoint | null>(null),
    research = useRef<{
      checkpoint: SpatialCheckpoint | null;
      tab: "business" | "test";
      ascending: boolean;
      scroll: number;
      businessPath: string | null;
      businessNode: string | null;
    } | null>(null);
  const adapter = useMemo(() => createAnalysisAdapter(mode), [mode]);
  const reduced = reduce || systemReduce;
  const reset = () => {
    request.current.invalidate();
    setReport(null);
    setPhase("entry");
    setError("");
    setItems([]);
    setSelection(null);
    setExpanded(false);
    setBusinessPath(null);
    setBusinessNode(null);
    setAscending(false);
    setTab("business");
    checkpoint.current = null;
    research.current = null;
  };
  const loadEvents = useCallback(() => {
    const abort = new AbortController();
    setEventError("");
    adapter
      .listEvents(abort.signal)
      .then(setEvents)
      .catch((e) => {
        if (!abort.signal.aborted) setEventError(e.message);
      });
    return () => abort.abort();
  }, [adapter]);
  useEffect(loadEvents, [loadEvents]);
  useEffect(() => () => request.current.invalidate(), []);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)"),
      cb = () => setSystemReduce(m.matches);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  }, []);
  const analyze = async () => {
    if (!eventId || phase === "loading") return;
    const req = request.current.begin();
    checkpoint.current = null;
    research.current = null;
    setSelection(null);
    setExpanded(false);
    setAscending(false);
    setTab("business");
    setBusinessNode(null);
    setPhase("loading");
    setReport(null);
    setItems([]);
    setError("");
    try {
      const r = await adapter.analyze(eventId, req.signal);
      if (req.current()) {
        setReport(r);
        setPhase("ready");
        setBusinessPath(r.paths?.[0]?.path_id ?? null);
      }
    } catch (e) {
      if (req.current()) {
        setError(e instanceof Error ? e.message : "分析失败");
        setPhase("error");
      }
    }
  };
  const rememberResearch = (origin?: SpatialCheckpoint) => {
    checkpoint.current = origin ?? graph.current?.captureContext() ?? null;
    research.current = {
      checkpoint: checkpoint.current,
      tab,
      ascending,
      scroll: origin?.scroll ?? research.current?.scroll ?? 0,
      businessPath,
      businessNode,
    };
  };
  const open = (
    item: DrawerItem,
    nested = false,
    origin?: SpatialCheckpoint,
  ) => {
    if (!nested) rememberResearch(origin);
    setItems((s) => (nested ? [...s, item] : [item]));
  };
  const close = useCallback(() => setItems([]), []);
  const returnGraph = () => {
    setItems([]);
    const context = research.current;
    if (context) {
      setTab(context.tab);
      setAscending(context.ascending);
      setBusinessPath(context.businessPath);
      setBusinessNode(context.businessNode);
      if (context.checkpoint) graph.current?.restoreContext(context.checkpoint);
      window.scrollTo({ top: context.scroll, behavior: "instant" });
    } else
      document
        .querySelector("#graph")
        ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };
  const goCompanies = (context: SpatialCheckpoint) => {
    checkpoint.current = context;
    research.current = {
      checkpoint: context,
      tab,
      ascending,
      scroll: window.scrollY,
      businessPath,
      businessNode,
    };
    document
      .querySelector("#companies")
      ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
  };
  const chosen = events.find((e) => e.event_id === eventId);
  const companies = sortCompanies(report?.companies ?? [], ascending);
  const item = items.at(-1);
  const businessCompany =
    item?.scope === "business"
      ? report?.companies?.find((c) => c.stock_code === item.key)
      : null;
  const testCompany =
    item?.scope === "test"
      ? testCompanies.find((c) => c.id === item.key)
      : null;
  const evidence =
    item?.scope === "business"
      ? report?.evidence?.find((e) => e.evidence_id === item.key)
      : testEvidence.find((e) => e.evidence_id === item?.key);
  const refs = (
    ids: string[] | null,
    scope: "business" | "test" = "business",
  ) =>
    ids === null ? (
      <div className="missing">证据引用 · 数据不足</div>
    ) : ids.length === 0 ? (
      <div className="missing">无证据，待核验</div>
    ) : (
      ids.map((id) => {
        const e =
          scope === "business"
            ? report?.evidence?.find((e) => e.evidence_id === id)
            : testEvidence.find((e) => e.evidence_id === id);
        return (
          <button
            key={id}
            className="drawer-list-item"
            onClick={() => open({ type: "evidence", key: id, scope }, true)}
          >
            <strong>{e?.source_title ?? "证据引用不可用"}</strong>
            <small>
              {id} · {e ? verification(e.verification_status) : "失效引用"}
            </small>
          </button>
        );
      })
    );
  const riskText = (flags: string[] | null) =>
    flags === null
      ? "风险数据不足"
      : flags.length
        ? flags.map(risk).join("、")
        : "未提供风险标记";
  return (
    <>
      <div
        ref={shell}
        className={`workspace-shell ${expanded ? "is-expanded" : ""}`}
      >
        <header className="header">
          <a className="brand" href="#" aria-label="SkyNexus 工作台">
            <img
              src="/assets/figma/40008321-29625.svg"
              width="24"
              height="24"
              alt=""
            />
            <strong>SkyNexus</strong>
            <span>低空智研</span>
          </a>
          <div className="data-switch" aria-label="数据来源">
            <button
              className={mode === "api" ? "active" : ""}
              onClick={() => {
                reset();
                setMode("api");
                setEventId("");
              }}
            >
              后端 API · Mock
            </button>
            <button
              className={mode === "file-mock" ? "active" : ""}
              onClick={() => {
                reset();
                setMode("file-mock");
                setEventId("");
              }}
            >
              文件 Mock
            </button>
          </div>
          <nav>
            <a href="#graph">产业路径</a>
            <a href="#companies">公司与证据</a>
          </nav>
          <label className="motion-setting">
            <input
              type="checkbox"
              checked={reduce || systemReduce}
              disabled={systemReduce}
              onChange={(e) => setReduce(e.target.checked)}
            />
            减少动态效果
          </label>
        </header>
        <main className="workspace">
          <div className="workspace-title">
            <h1>图谱探索工作台</h1>
            <p>自由探索路径，保持研究现场</p>
            <Badge>模拟数据 · 仅用于演示</Badge>
          </div>
          <section className="card event-card" aria-label="事件选择">
            <div className="event-selector">
              <label htmlFor="event">已有事件</label>
              <div className="event-input">
                <img
                  src="/assets/figma/40008321-29641.svg"
                  width="20"
                  height="20"
                  alt=""
                />
                <select
                  id="event"
                  value={eventId}
                  onChange={(e) => {
                    reset();
                    setEventId(e.target.value);
                  }}
                >
                  <option value="">请选择已有事件</option>
                  {events.map((e) => (
                    <option key={e.event_id} value={e.event_id}>
                      {value(e.event_name)}
                    </option>
                  ))}
                </select>
                {chosen?.event_date && <time>{chosen.event_date}</time>}
              </div>
              <small>
                {eventError ? (
                  <>
                    <span role="alert">{eventError}</span>{" "}
                    <button onClick={loadEvents}>重新读取</button>
                  </>
                ) : events.length === 0 ? (
                  "暂无可分析事件"
                ) : (
                  "事件列表来自 data/mock/events.json · 当前 API 无列表接口"
                )}
              </small>
            </div>
            <button
              className="outline analyze"
              disabled={!eventId || phase === "loading"}
              onClick={analyze}
            >
              {phase === "loading" ? "分析中…" : "查看分析"}
            </button>
            {report && (
              <div className="metrics">
                <div>
                  <small>事件方向</small>
                  <span>{value(report.event.direction)}</span>
                </div>
                <div>
                  <small>分析返回公司</small>
                  <strong>{value(report.counts.returned_companies)}</strong>
                </div>
                <div>
                  <small>证据</small>
                  <strong>{value(report.counts.evidence)}</strong>
                </div>
                <div>
                  <small>影响环节</small>
                  <span>{value(report.counts.affected_nodes)}</span>
                </div>
              </div>
            )}
          </section>
          {!report ? (
            <section className="card entry" aria-live="polite">
              <Badge kind={phase === "error" ? "amber" : "blue"}>
                {phase === "loading"
                  ? "正在请求分析"
                  : phase === "error"
                    ? "分析失败"
                    : "事件研究"}
              </Badge>
              <h2>
                {phase === "loading"
                  ? "正在读取所选事件的报告"
                  : phase === "error"
                    ? error
                    : "从事件出发，探索产业影响"}
              </h2>
              <p>
                {phase === "error"
                  ? "检查后端服务后重试，或主动切换文件 Mock。请求失败不会切换数据来源。"
                  : phase === "loading"
                    ? "返回后展示真实评分和来源；加载中可更换事件。"
                    : "选择“动力电池价格下降 15%”，点击查看分析。Mock 公司、评分与来源仅用于演示。"}
              </p>
              {phase === "error" && (
                <button className="primary" onClick={analyze}>
                  重试分析
                </button>
              )}
            </section>
          ) : (
            <>
              {report.empty && (
                <div className="missing" role="status">
                  报告明确为空，没有路径、公司或证据；不表示零影响。
                </div>
              )}
              <SpatialGraph
                key={`${mode}:${eventId}`}
                ref={graph}
                eventId={eventId}
                reducedMotion={reduced}
                paused={paused}
                researchOpen={!!items.length}
                testCompanyMode={tab === "test"}
                onSelectionChange={setSelection}
                onNodeResearch={(key, context) => {
                  checkpoint.current = context;
                  open({ type: "node", key, scope: "test" }, false, context);
                }}
                onCompanyCompare={goCompanies}
                onExpandedChange={setExpanded}
              />
              {!expanded && (
                <>
                  <section
                    id="companies"
                    className="card company-card"
                    aria-label="公司影响评分"
                  >
                    <div className="section-heading">
                      <h2>
                        {tab === "business" ? "公司影响评分" : "TEST 公司联动"}
                      </h2>
                      <span className="score-scope">
                        {tab === "business"
                          ? "影响强度 0–100 · 不代表收益预测"
                          : "独立合成映射 · 不含金融评分"}
                      </span>
                      <button
                        className="outline"
                        onClick={() =>
                          open({
                            type: "sources",
                            key: "sources",
                            scope: "business",
                          })
                        }
                      >
                        数据来源
                      </button>
                    </div>
                    <div className="company-tabs">
                      <div className="tabs">
                        <button
                          className={tab === "business" ? "active" : ""}
                          onClick={() => setTab("business")}
                        >
                          分析返回公司 {value(report.counts.returned_companies)}
                        </button>
                        <button
                          className={tab === "test" ? "active" : ""}
                          onClick={() => setTab("test")}
                        >
                          TEST 联动
                        </button>
                      </div>
                      <small>
                        {tab === "business"
                          ? "业务节点映射 · 数据不足"
                          : selection?.nodeKey
                            ? `TEST ${selection.nodeKey} · ${selection.filtered ? "主动筛选" : "仅高亮"}`
                            : "选择 TEST 节点后高亮，主动筛选"}
                      </small>
                      <button className="return-graph" onClick={returnGraph}>
                        返回图谱现场
                      </button>
                      {tab === "business" && (
                        <button
                          className="sort"
                          onClick={() => setAscending((s) => !s)}
                        >
                          按影响评分{ascending ? "升序" : "降序"}
                        </button>
                      )}
                    </div>
                    {tab === "business" ? (
                      report.companies === null ? (
                        <div className="missing">公司集合 · 数据不足</div>
                      ) : companies.length === 0 ? (
                        <div className="missing">暂无返回公司</div>
                      ) : (
                        <div className="table-scroll">
                          <table>
                            <colgroup>
                              {[
                                256, 112, 106, 106, 152, 144, 220, 100, 132,
                              ].map((w, i) => (
                                <col key={i} style={{ width: w }} />
                              ))}
                            </colgroup>
                            <thead>
                              <tr>
                                {[
                                  "公司 / 证券代码",
                                  "方向",
                                  "业务暴露度",
                                  "传导敏感度",
                                  "财务重要性",
                                  "影响评分",
                                  "主要风险",
                                  "证据",
                                  "核验状态",
                                ].map((x) => (
                                  <th key={x}>{x}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {companies.map((c, i) => (
                                <tr key={c.stock_code}>
                                  <td>
                                    <span className="rank">
                                      {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <button
                                      className="company-name"
                                      onClick={() =>
                                        open({
                                          type: "company",
                                          key: c.stock_code,
                                          scope: "business",
                                        })
                                      }
                                    >
                                      {value(c.company_name)}
                                    </button>
                                    <small>
                                      {c.stock_code} · {value(c.chain_role)}
                                    </small>
                                  </td>
                                  <td>
                                    <Badge kind={c.impact_direction ?? "gray"}>
                                      {direction(c.impact_direction)}
                                    </Badge>
                                  </td>
                                  {[
                                    c.exposure,
                                    c.sensitivity,
                                    c.financial_materiality,
                                  ].map((v, j) => (
                                    <td className="part" key={j}>
                                      {value(v)}
                                    </td>
                                  ))}
                                  <td className="score">
                                    {score(c.impact_score)}
                                  </td>
                                  <td className="risk-text">
                                    {riskText(c.risk_flags)}
                                  </td>
                                  <td>
                                    <button
                                      className="outline"
                                      onClick={() =>
                                        open({
                                          type: "company",
                                          key: c.stock_code,
                                          scope: "business",
                                        })
                                      }
                                    >
                                      {c.evidence_ids === null
                                        ? missing
                                        : `${c.evidence_ids.length} 条`}
                                    </button>
                                  </td>
                                  <td>
                                    <Badge
                                      kind={
                                        c.verification_status ===
                                        "pending_verification"
                                          ? "amber"
                                          : "blue"
                                      }
                                    >
                                      {verification(c.verification_status)}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : (
                      <div className="table-scroll">
                        <table className="test-table">
                          <thead>
                            <tr>
                              <th>TEST 公司</th>
                              <th>明确合成映射</th>
                              <th>关联反馈</th>
                              <th>金融评分</th>
                              <th>测试记录</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testCompanies
                              .filter(
                                (c) =>
                                  !selection?.filtered ||
                                  selection.testCompanyIds.includes(c.id),
                              )
                              .map((c) => (
                                <tr
                                  key={c.id}
                                  className={
                                    selection?.testCompanyIds.includes(c.id)
                                      ? "mapped"
                                      : ""
                                  }
                                >
                                  <td>
                                    <button
                                      className="company-name"
                                      onClick={() =>
                                        open({
                                          type: "company",
                                          key: c.id,
                                          scope: "test",
                                        })
                                      }
                                    >
                                      {c.name}
                                    </button>
                                    <small>{c.id}</small>
                                  </td>
                                  <td>{c.node_ids.join(" / ")}</td>
                                  <td>
                                    {selection?.testCompanyIds.includes(c.id)
                                      ? "已高亮"
                                      : "未关联"}
                                  </td>
                                  <td>无金融评分</td>
                                  <td>
                                    <button
                                      className="outline"
                                      onClick={() =>
                                        open({
                                          type: "company",
                                          key: c.id,
                                          scope: "test",
                                        })
                                      }
                                    >
                                      {c.evidence_ids.length} 条
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="evidence-strip">
                      <span>
                        {tab === "business"
                          ? `${report.data_version ?? missing} · ${mode === "api" ? "API 分项未提供" : "文件 Mock 完整分项"}`
                          : "TEST 与业务 Mock 严格隔离"}
                      </span>
                      <button
                        onClick={() =>
                          open({
                            type: "sources",
                            key: "sources",
                            scope: "business",
                          })
                        }
                      >
                        查看来源与运行信息
                      </button>
                    </div>
                  </section>
                  <section
                    className="card source-shelf"
                    aria-label="业务路径与证据"
                  >
                    <div className="section-heading">
                      <h2>业务路径与原始证据</h2>
                      <span className="muted">
                        仅消费报告字段，TEST 网络不代表业务路径
                      </span>
                    </div>
                    <div className="business-paths">
                      {report.paths === null ? (
                        <div className="missing">路径集合 · 数据不足</div>
                      ) : report.paths.length === 0 ? (
                        <div className="missing">暂无业务路径</div>
                      ) : (
                        report.paths.map((p) => (
                          <div
                            key={p.path_id}
                            className={
                              businessPath === p.path_id
                                ? "business-path active"
                                : "business-path"
                            }
                          >
                            <button
                              onClick={() => {
                                setBusinessPath(p.path_id);
                                setBusinessNode(null);
                              }}
                            >
                              <strong>{p.path_id}</strong>
                              <Badge kind={p.impact_direction ?? "gray"}>
                                {direction(p.impact_direction)}
                              </Badge>
                            </button>
                            <div className="id-nodes">
                              {p.node_ids?.map((id) => (
                                <button
                                  key={id}
                                  className={
                                    businessNode === id ? "active" : ""
                                  }
                                  onClick={() => {
                                    setBusinessPath(p.path_id);
                                    setBusinessNode(id);
                                    open({
                                      type: "path",
                                      key: p.path_id,
                                      scope: "business",
                                    });
                                  }}
                                >
                                  {id}
                                </button>
                              )) ?? missing}
                            </div>
                            <small>
                              节点名称、边端点、公司映射与规则正文尚未提供
                            </small>
                            <button
                              className="path-details"
                              onClick={() =>
                                open({
                                  type: "path",
                                  key: p.path_id,
                                  scope: "business",
                                })
                              }
                            >
                              查看规则 ID 与证据
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="evidence-grid">
                      {report.evidence === null ? (
                        <div className="missing">证据集合 · 数据不足</div>
                      ) : report.evidence.length === 0 ? (
                        <div className="missing">暂无事件证据</div>
                      ) : (
                        report.evidence.map((e) => (
                          <button
                            className="evidence-card"
                            key={e.evidence_id}
                            onClick={() =>
                              open({
                                type: "evidence",
                                key: e.evidence_id,
                                scope: "business",
                              })
                            }
                          >
                            <small>
                              {e.published_date ?? "发布日期未提供"}
                            </small>
                            <strong>{value(e.source_title)}</strong>
                            <p>{value(e.quote)}</p>
                            <span className="evidence-axes">
                              <Badge kind="amber">
                                {e.is_mock ? "Mock 样例" : "来源记录"}
                              </Badge>
                              <span>可信度 {value(e.credibility_level)}</span>
                              <span>{verification(e.verification_status)}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="conclusions">
                      {report.conclusions?.map((c) => (
                        <div key={c.conclusion_id}>
                          <p>{value(c.text)}</p>
                          <small>
                            {c.conclusion_id} ·{" "}
                            {verification(c.verification_status)}
                            {c.evidence_ids?.length === 0
                              ? " · 无证据，待核验"
                              : ""}
                          </small>
                          <div>
                            {c.evidence_ids?.map((id) => (
                              <button
                                key={id}
                                onClick={() =>
                                  open({
                                    type: "evidence",
                                    key: id,
                                    scope: "business",
                                  })
                                }
                              >
                                {id}
                                {report.evidence?.some(
                                  (e) => e.evidence_id === id,
                                )
                                  ? ""
                                  : " · 引用失效"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )) ?? <div className="missing">结论集合 · 数据不足</div>}
                    </div>
                    <p className="source-note">{report.issues.join("；")}</p>
                  </section>
                </>
              )}
              <footer className="run-footer">
                <span>
                  {report.provenance.source} ·{" "}
                  {report.data_version ?? "版本数据不足"}
                </span>
                <button
                  onClick={() =>
                    open({ type: "sources", key: "sources", scope: "business" })
                  }
                >
                  运行信息
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={paused}
                    onChange={(e) => setPaused(e.target.checked)}
                  />
                  暂停非必要运动
                </label>
              </footer>
            </>
          )}
        </main>
      </div>
      {item && (
        <DrawerHost
          items={items}
          shell={shell}
          reduced={reduced}
          onClose={close}
          onBack={() => setItems((s) => s.slice(0, -1))}
          onReturn={returnGraph}
        >
          {item.type === "node" && (
            <>
              <div className="drawer-context">
                <Badge kind="amber">TEST · 合成节点</Badge>
                <h3>{testNodes.find((n) => n.key === item.key)?.label}</h3>
                <p>TEST_NODE_{item.key}</p>
              </div>
              <h3>关联 TEST 公司</h3>
              {testCompanies
                .filter((c) => c.node_ids.includes(item.key as NodeKey))
                .map((c) => (
                  <button
                    className="drawer-list-item"
                    key={c.id}
                    onClick={() =>
                      open({ type: "company", key: c.id, scope: "test" }, true)
                    }
                  >
                    <strong>{c.name}</strong>
                    <small>合成映射 · 无证券代码与金融评分</small>
                  </button>
                ))}
              {!testCompanies.some((c) =>
                c.node_ids.includes(item.key as NodeKey),
              ) && <div className="missing">此 TEST 节点没有公司映射</div>}
              <h3>业务映射与规则</h3>
              <div className="missing">
                数据不足。该节点不能关联到业务 Mock
                公司，合成曲线不代表真实规则。
              </div>
            </>
          )}
          {item.type === "company" && (businessCompany || testCompany) && (
            <>
              <div className="drawer-context">
                <Badge kind="amber">
                  {item.scope === "test"
                    ? "TEST · 合成公司"
                    : businessCompany?.is_mock
                      ? "Mock · 模拟公司"
                      : "来源公司"}
                </Badge>
                <h3>{businessCompany?.company_name ?? testCompany?.name}</h3>
                <p>{businessCompany?.stock_code ?? testCompany?.id}</p>
                {businessCompany && (
                  <div className="drawer-score">
                    {score(businessCompany.impact_score)}
                    <span>
                      影响强度 · {direction(businessCompany.impact_direction)}
                    </span>
                  </div>
                )}
              </div>
              {businessCompany ? (
                <>
                  <h3>评分分项</h3>
                  <div className="score-parts">
                    {[
                      ["业务暴露度", businessCompany.exposure],
                      ["传导敏感度", businessCompany.sensitivity],
                      ["财务重要性", businessCompany.financial_materiality],
                    ].map(([title, v]) => (
                      <div key={String(title)}>
                        <small>{title}</small>
                        <strong>{value(v)}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="trace">
                    {mode === "api"
                      ? "API 未提供分项 / 公式版本"
                      : `financial_scores.json · ${value(businessCompany.formula_version)}`}
                  </p>
                  <h3>风险</h3>
                  <p>{riskText(businessCompany.risk_flags)}</p>
                  <h3>核验状态</h3>
                  <Badge kind="amber">
                    {verification(businessCompany.verification_status)}
                  </Badge>
                  <h3>该公司的证据</h3>
                  {refs(businessCompany.evidence_ids)}
                </>
              ) : (
                testCompany && (
                  <>
                    <div className="missing">
                      明确 TEST 映射：{testCompany.node_ids.join(" / ")}
                      。无金融评分、证券代码或真实证据。
                    </div>
                    <h3>测试记录</h3>
                    {refs(testCompany.evidence_ids, "test")}
                  </>
                )
              )}
            </>
          )}
          {item.type === "evidence" &&
            (!evidence ? (
              <div className="missing">
                证据引用不可用：{item.key}。不会借用其他来源。
              </div>
            ) : (
              <>
                <div className="drawer-context">
                  <Badge kind="amber">
                    {item.scope === "test"
                      ? "TEST · 合成记录"
                      : "is_mock" in evidence && evidence.is_mock
                        ? "Mock · 模拟证据"
                        : "来源记录"}
                  </Badge>
                  <h3>{value(evidence.source_title)}</h3>
                  <p>{evidence.evidence_id}</p>
                </div>
                <div className="metadata">
                  <span>
                    发布日期<b>{evidence.published_date ?? "未提供"}</b>
                  </span>
                  <span>
                    来源可信度<b>{value(evidence.credibility_level)}</b>
                  </span>
                  <span>
                    核验状态<b>{verification(evidence.verification_status)}</b>
                  </span>
                </div>
                <h3>原文短摘录</h3>
                <blockquote>{value(evidence.quote)}</blockquote>
                <h3>来源链接</h3>
                {safeSourceUrl(evidence.source_url) ? (
                  <>
                    <a
                      className="source-url"
                      href={evidence.source_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {evidence.source_url}
                    </a>
                    <a
                      className="primary source-link"
                      href={evidence.source_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      查看原始来源（新窗口）
                    </a>
                    {evidence.source_url?.includes("example.com") && (
                      <p className="trace">
                        example.com 为演示地址，不保证提供真实原文。
                      </p>
                    )}
                  </>
                ) : (
                  <div className="missing">来源链接不可用</div>
                )}
                <h3>阅读边界</h3>
                <p>
                  数据属性、来源可信度、核验状态分别表达。Mock
                  不会自动转换成真实的“未核验”。
                </p>
              </>
            ))}
          {item.type === "path" &&
            (() => {
              const p = report?.paths?.find((p) => p.path_id === item.key);
              return (
                <>
                  <div className="drawer-context">
                    <h3>{p?.path_id ?? missing}</h3>
                    <p>{businessNode ?? "业务路径 · ID 视图"}</p>
                    <Badge kind={p?.impact_direction ?? "gray"}>
                      {direction(p?.impact_direction ?? null)}
                    </Badge>
                  </div>
                  <h3>来源节点 ID</h3>
                  <p className="trace">{p?.node_ids?.join(" / ") ?? missing}</p>
                  <h3>来源关系 ID</h3>
                  <p className="trace">
                    {p?.relation_ids?.join(" / ") ?? missing}
                  </p>
                  <h3>规则 ID</h3>
                  <p className="trace">{p?.rule_id ?? missing}</p>
                  <div className="missing">
                    规则正文、边端点、节点名称与公司映射 · 数据不足。不能用 ID
                    顺序生成业务连线。
                  </div>
                  <h3>路径证据</h3>
                  {refs(p?.evidence_ids ?? null)}
                </>
              );
            })()}
          {item.type === "sources" && (
            <>
              <div className="drawer-context">
                <h3>数据来源与运行信息</h3>
                <p>{report?.provenance.source}</p>
              </div>
              <h3>当前报告</h3>
              <div className="metadata">
                <span>
                  数据版本<b>{value(report?.data_version)}</b>
                </span>
                <span>
                  报告 ID<b>{value(report?.report_id)}</b>
                </span>
                <span>
                  运行 ID<b>{value(report?.run_id)}</b>
                </span>
                <span>
                  生成时间<b>{value(report?.generated_at)}</b>
                </span>
              </div>
              {mode === "file-mock" && (
                <p>文件模式不伪造服务运行 ID 或生成时间。</p>
              )}
              <h3>真实接口</h3>
              <p>
                POST /api/v1/analyze，输入 event_id 与 data_version；GET /health
                用于服务健康检查。事件列表从已合入 Mock 文件读取。
              </p>
              <h3>业务能力缺口</h3>
              <div className="missing">
                当前报告未提供节点名称、关系端点、规则正文、节点公司映射、三个评分分项与公式版本。文件模式可读取同版本评分分项，API
                模式保持缺项。
              </div>
              <h3>TEST 隔离边界</h3>
              <p>
                10 个合成节点、9 条关系、5 条路径，仅验证空间操作。TEST
                公司与记录使用独立 ID，无金融评分或真实来源。
              </p>
              <h3>公司数量语义</h3>
              <p>
                分析返回公司仅统计当前报告，不代表完整候选集。PR #9 新评分数据和
                PR #7 证据库尚未进入此 API，不由前端擅自接入。
              </p>
              <p className="trace">{report?.provenance.files.join("\n")}</p>
            </>
          )}
        </DrawerHost>
      )}
    </>
  );
}
