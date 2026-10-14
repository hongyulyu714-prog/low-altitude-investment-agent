/** Source fields retain snake_case and raw enums; null means unavailable, [] means explicitly empty. */
export type DataMode = "api" | "file-mock";
export type Direction = "positive" | "negative" | "neutral" | "uncertain";
export interface EventView {
  event_id: string;
  event_name: string | null;
  direction: string | null;
  event_type: string | null;
  event_date: string | null;
  affected_node_ids: string[] | null;
  source_title: string | null;
  source_url: string | null;
  verification_status: string | null;
}
export interface EvidenceView {
  evidence_id: string;
  event_id: string;
  source_title: string | null;
  published_date: string | null;
  quote: string | null;
  source_url: string | null;
  credibility_level: string | null;
  verification_status: string | null;
  stock_codes: string[] | null;
  is_mock: boolean;
}
export interface PathView {
  path_id: string;
  event_id: string;
  node_ids: string[] | null;
  relation_ids: string[] | null;
  rule_id: string | null;
  impact_direction: string | null;
  evidence_ids: string[] | null;
}
export interface CompanyView {
  stock_code: string;
  company_id: string | null;
  company_name: string | null;
  chain_role: string | null;
  impact_direction: string | null;
  impact_score: number | null;
  exposure: number | null;
  sensitivity: number | null;
  financial_materiality: number | null;
  formula_version: string | null;
  risk_flags: string[] | null;
  evidence_ids: string[] | null;
  verification_status: string | null;
  is_mock: boolean;
}
export interface ConclusionView {
  conclusion_id: string;
  text: string | null;
  evidence_ids: string[] | null;
  verification_status: string | null;
}
export interface ReportView {
  mode: DataMode;
  event: EventView;
  report_id: string | null;
  run_id: string | null;
  data_version: string | null;
  generated_at: string | null;
  verification_status: string | null;
  is_mock: boolean;
  paths: PathView[] | null;
  companies: CompanyView[] | null;
  evidence: EvidenceView[] | null;
  conclusions: ConclusionView[] | null;
  issues: string[];
  counts: {
    affected_nodes: number | null;
    returned_companies: number | null;
    evidence: number | null;
  };
  provenance: { source: string; files: string[]; server_run: boolean };
  empty: boolean;
}
export interface FileMockData {
  events: unknown;
  graph_paths: unknown;
  companies: unknown;
  financial_scores: unknown;
  evidence: unknown;
}
