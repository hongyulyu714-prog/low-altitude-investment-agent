import type {
  CompanyView,
  DataMode,
  EventView,
  FileMockData,
  ReportView,
} from "./types";
type Row = Record<string, unknown>;
const object = (value: unknown): Row =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;
const strings = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((x) => typeof x === "string")
    ? value
    : null;
const rows = (value: unknown): Row[] | null =>
  Array.isArray(value)
    ? value
        .filter((x) => x && typeof x === "object" && !Array.isArray(x))
        .map(object)
    : null;
const score = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100
    ? value
    : null;
export function safeSourceUrl(value: unknown): string | null {
  const raw = str(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return ["https:", "http:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password
      ? raw
      : null;
  } catch {
    return null;
  }
}
export function normalizeEvent(value: unknown): EventView {
  const r = object(value);
  const id = str(r.event_id);
  if (!id) throw new Error("事件数据缺少 event_id");
  return {
    event_id: id,
    event_name: str(r.event_name),
    direction: str(r.direction),
    event_type: str(r.event_type),
    event_date: str(r.event_date),
    affected_node_ids: strings(r.affected_node_ids),
    source_title: str(r.source_title),
    source_url: safeSourceUrl(r.source_url),
    verification_status: str(r.verification_status),
  };
}
export function sortCompanies(
  companies: CompanyView[],
  ascending = false,
): CompanyView[] {
  return [...companies].sort((a, b) =>
    a.impact_score === null
      ? b.impact_score === null
        ? a.stock_code.localeCompare(b.stock_code)
        : 1
      : b.impact_score === null
        ? -1
        : (ascending
            ? a.impact_score - b.impact_score
            : b.impact_score - a.impact_score) ||
          a.stock_code.localeCompare(b.stock_code),
  );
}
/** API payload normalization intentionally does not accept any local file supplementation. */
export function normalizeReport(
  payload: unknown,
  expectedEventId: string,
  mode: DataMode = "api",
): ReportView {
  const r = object(payload);
  const event = normalizeEvent(r.event);
  if (event.event_id !== expectedEventId)
    throw new Error("响应事件与当前分析请求不一致");
  const issues: string[] = [];
  const collection = (name: string): Row[] | null => {
    const value = rows(r[name]);
    if (value === null) issues.push(`${name} 集合缺失或格式无效`);
    else if (Array.isArray(r[name]) && value.length !== r[name].length)
      issues.push(`${name} 包含无效记录`);
    return value;
  };
  const sameEvent = (name: string, value: Row[] | null) =>
    value?.filter((x) => {
      if (x.event_id !== expectedEventId) {
        issues.push(`${name} 存在其他事件或缺失事件标识的记录，已隔离`);
        return false;
      }
      return true;
    }) ?? null;
  const paths =
    sameEvent("paths", collection("paths"))
      ?.filter((x) => {
        if (!str(x.path_id)) {
          issues.push("路径缺少 path_id");
          return false;
        }
        return true;
      })
      .map((x) => ({
        node_names: Object.fromEntries(
          Object.entries(object(x.node_names)).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        ),
        rule_text: str(x.rule_text),
        verification_status: str(x.verification_status),
        path_id: x.path_id as string,
        event_id: expectedEventId,
        node_ids: strings(x.node_ids),
        relation_ids: strings(x.relation_ids),
        rule_id: str(x.rule_id),
        impact_direction: str(x.impact_direction),
        evidence_ids: strings(x.evidence_ids),
      })) ?? null;
  const evidence =
    sameEvent("evidence", collection("evidence"))
      ?.filter((x) => {
        if (!str(x.evidence_id)) {
          issues.push("证据缺少 evidence_id");
          return false;
        }
        return true;
      })
      .map((x) => ({
        evidence_id: x.evidence_id as string,
        event_id: expectedEventId,
        source_title: str(x.source_title),
        published_date: str(x.published_date),
        quote: str(x.quote),
        source_url: safeSourceUrl(x.source_url),
        credibility_level: str(x.credibility_level),
        verification_status: str(x.verification_status),
        stock_codes: strings(x.stock_codes),
        is_mock:
          x.verification_status === "mock" || x.credibility_level === "mock",
      })) ?? null;
  const companies =
    collection("companies")
      ?.filter((x) => {
        if (!str(x.stock_code)) {
          issues.push("公司缺少 stock_code");
          return false;
        }
        return true;
      })
      .map((x) => ({
        stock_code: x.stock_code as string,
        company_id: str(x.company_id),
        node_ids: strings(x.node_ids),
        score_basis: str(x.score_basis),
        company_name: str(x.company_name),
        chain_role: str(x.chain_role),
        impact_direction: str(x.impact_direction),
        impact_score: score(x.impact_score),
        exposure: score(x.exposure),
        sensitivity: score(x.sensitivity),
        financial_materiality: score(x.financial_materiality),
        formula_version: str(x.formula_version),
        risk_flags: strings(x.risk_flags),
        evidence_ids: strings(x.evidence_ids),
        verification_status: str(x.verification_status),
        is_mock:
          mode === "file-mock" ||
          x.verification_status === "mock" ||
          strings(x.risk_flags)?.includes("mock_data") === true,
      })) ?? null;
  const conclusions =
    collection("conclusions")
      ?.filter((x) => {
        if (!str(x.conclusion_id)) {
          issues.push("结论缺少 conclusion_id");
          return false;
        }
        return true;
      })
      .map((x) => ({
        conclusion_id: x.conclusion_id as string,
        text: str(x.text),
        evidence_ids: strings(x.evidence_ids),
        verification_status: str(x.verification_status),
      })) ?? null;
  const evidenceIds = new Set(evidence?.map((x) => x.evidence_id));
  for (const owner of [
    ...(paths ?? []),
    ...(companies ?? []),
    ...(conclusions ?? []),
  ])
    for (const id of owner.evidence_ids ?? [])
      if (!evidenceIds.has(id)) issues.push(`引用失效：${id}`);
  const nodeSetsComplete =
    paths !== null && paths.every((p) => p.node_ids !== null);
  return {
    mode,
    event,
    report_id: str(r.report_id),
    run_id: str(r.run_id),
    data_version: str(r.data_version),
    generated_at: str(r.generated_at),
    verification_status: str(r.verification_status),
    is_mock: mode === "file-mock" || r.verification_status === "mock",
    paths,
    companies: companies ? sortCompanies(companies) : null,
    evidence,
    conclusions,
    issues: [...new Set(issues)],
    counts: {
      affected_nodes: nodeSetsComplete
        ? new Set(paths.flatMap((p) => p.node_ids ?? [])).size
        : null,
      returned_companies:
        companies === null
          ? null
          : new Set(companies.map((c) => c.stock_code)).size,
      evidence:
        evidence === null
          ? null
          : new Set(evidence.map((e) => e.evidence_id)).size,
    },
    provenance: {
      source:
        mode === "api"
          ? "POST /api/v1/analyze"
          : "data/mock/ · 本地文件组合（非服务器运行）",
      files:
        mode === "api"
          ? []
          : [
              "events.json",
              "graph_paths.json",
              "companies.json",
              "financial_scores.json",
              "evidence.json",
            ],
      server_run: mode === "api",
    },
    empty:
      paths?.length === 0 &&
      companies?.length === 0 &&
      evidence?.length === 0 &&
      conclusions?.length === 0,
  };
}
export function resolveEvidenceReferences(
  report: ReportView,
  ids: string[] | null,
) {
  return {
    missing_list: ids === null,
    items: (ids ?? []).map((id) => ({
      id,
      evidence:
        report.evidence?.find(
          (e) => e.evidence_id === id && e.event_id === report.event.event_id,
        ) ?? null,
    })),
  };
}
/** Compose only supplied same-event scoring rows; never infer candidates from the company file. */
export function composeFileMock(
  data: FileMockData,
  eventId: string,
  version = "mock-v1",
): ReportView {
  if (version !== "mock-v1")
    throw new Error(`本地文件不支持数据版本 ${version}`);
  const requireRows = (key: keyof FileMockData) => {
    const result = rows(data[key]);
    if (
      !result ||
      !Array.isArray(data[key]) ||
      result.length !== data[key].length
    )
      throw new Error(`${key} 必须是有效记录数组`);
    return result;
  };
  const events = requireRows("events");
  const allPaths = requireRows("graph_paths");
  const allCompanies = requireRows("companies");
  const allScores = requireRows("financial_scores");
  const allEvidence = requireRows("evidence");
  const event = events.find((x) => x.event_id === eventId);
  if (!event) throw new Error(`找不到事件 ${eventId}`);
  const paths = allPaths.filter((x) => x.event_id === eventId);
  if (!paths.length) throw new Error(`事件 ${eventId} 没有可追溯的图谱路径`);
  const evidence = allEvidence.filter((x) => x.event_id === eventId);
  const evidenceIds = new Set(evidence.map((x) => x.evidence_id));
  const companyByCode = new Map(allCompanies.map((x) => [x.stock_code, x]));
  for (const e of evidence)
    for (const code of strings(e.stock_codes) ?? [])
      if (!companyByCode.has(code))
        throw new Error(`证据引用未知证券代码 ${code}`);
  for (const p of paths)
    for (const id of strings(p.evidence_ids) ?? [])
      if (!evidenceIds.has(id)) throw new Error(`图谱路径引用失效：${id}`);
  const companies = allScores
    .filter((x) => x.event_id === eventId)
    .map((s) => {
      const c = companyByCode.get(s.stock_code);
      if (!c) throw new Error(`评分引用未知证券代码 ${s.stock_code}`);
      const ids = evidence
        .filter((e) => strings(e.stock_codes)?.includes(s.stock_code as string))
        .map((e) => e.evidence_id);
      return {
        ...s,
        company_id: c.company_id,
        company_name: c.company_name,
        chain_role: c.chain_role,
        evidence_ids: ids,
        risk_flags: Array.isArray(s.risk_flags)
          ? [...s.risk_flags, ...(ids.length ? [] : ["pending_verification"])]
          : undefined,
        verification_status: ids.length ? "mock" : "pending_verification",
      };
    });
  // This is a local projection, not a forged server execution or server-authored conclusion.
  return normalizeReport(
    {
      event,
      paths,
      companies,
      evidence,
      data_version: version,
      verification_status: "mock",
    },
    eventId,
    "file-mock",
  );
}
