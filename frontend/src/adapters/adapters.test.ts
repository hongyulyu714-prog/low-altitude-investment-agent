import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createAnalysisAdapter, LatestRequestGuard } from "./index";
import {
  composeFileMock,
  normalizeReport,
  resolveEvidenceReferences,
  safeSourceUrl,
  sortCompanies,
} from "./normalize";
import type { FileMockData } from "./types";
const event = {
  event_id: "EVT_A",
  event_name: "Source name",
  direction: "下降",
};
const report = {
  event,
  paths: [],
  companies: [],
  evidence: [],
  conclusions: [],
  verification_status: "mock",
};
const data: FileMockData = {
  events: [event],
  graph_paths: [
    {
      path_id: "PATH_A",
      event_id: "EVT_A",
      node_ids: ["NODE_A", "NODE_B"],
      relation_ids: ["REL_A"],
      rule_id: "RULE_A",
      impact_direction: "positive",
      evidence_ids: ["EVD_A"],
    },
  ],
  companies: [
    {
      stock_code: "000001.SZ",
      company_id: "COMP_A",
      company_name: "Source company",
      chain_role: "Source role",
    },
  ],
  financial_scores: [
    {
      stock_code: "000001.SZ",
      event_id: "EVT_A",
      exposure: 88,
      sensitivity: 62,
      financial_materiality: 70,
      impact_score: 38.19,
      risk_flags: ["untranslated-risk"],
      impact_direction: "negative",
      formula_version: "source formula",
    },
  ],
  evidence: [
    {
      evidence_id: "EVD_A",
      event_id: "EVT_A",
      stock_codes: ["000001.SZ"],
      source_title: "Source evidence",
      credibility_level: "A",
      verification_status: "pending_verification",
      source_url: "https://example.com/source",
    },
  ],
};
describe("report fidelity", () => {
  it("reads the repository five-file corpus without fabricated candidate expansion", () => {
    const load = (name: string) =>
      JSON.parse(
        readFileSync(
          new URL(`../../../data/mock/${name}.json`, import.meta.url),
          "utf8",
        ),
      );
    const r = composeFileMock(
      {
        events: load("events"),
        companies: load("companies"),
        financial_scores: load("financial_scores"),
        evidence: load("evidence"),
        graph_paths: load("graph_paths"),
      },
      "EVT_BATTERY_PRICE_DOWN_001",
    );
    expect(r.counts).toEqual({
      affected_nodes: 4,
      returned_companies: 3,
      evidence: 3,
    });
    expect(r.companies?.map((c) => [c.stock_code, c.impact_score])).toEqual([
      ["000003.SZ", 40.8],
      ["000001.SZ", 38.19],
      ["000002.SZ", 37.12],
    ]);
    expect(r.companies?.[0].evidence_ids).toEqual([
      "EVD_BATTERY_001",
      "EVD_EVTOL_001",
    ]);
    expect(r.companies?.[1].evidence_ids).toEqual(["EVD_BATTERY_001"]);
  });
  it("distinguishes absent collections from explicit empty arrays", () => {
    expect(normalizeReport(report, "EVT_A").empty).toBe(true);
    const result = normalizeReport({ event }, "EVT_A");
    expect(result.paths).toBeNull();
    expect(result.counts.returned_companies).toBeNull();
    expect(result.empty).toBe(false);
  });
  it("keeps zero scores, unknown risks, raw enums and never supplements API subscores", () => {
    const result = normalizeReport(
      {
        ...report,
        companies: [
          {
            stock_code: "000001.SZ",
            impact_score: 0,
            exposure: 88,
            risk_flags: ["unknown"],
            verification_status: "mock",
            impact_direction: "neutral",
          },
        ],
      },
      "EVT_A",
    );
    expect(result.companies?.[0]).toMatchObject({
      impact_score: 0,
      exposure: null,
      risk_flags: ["unknown"],
      verification_status: "mock",
      impact_direction: "neutral",
    });
  });
  it("sorts ties by code and leaves missing score last in either direction", () => {
    const r = normalizeReport(
      {
        ...report,
        companies: [
          { stock_code: "B", impact_score: 0 },
          { stock_code: "C" },
          { stock_code: "A", impact_score: 0 },
        ],
      },
      "EVT_A",
    );
    expect(sortCompanies(r.companies!, true).map((c) => c.stock_code)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });
  it("preserves missing vs empty risks", () => {
    const r = normalizeReport(
      {
        ...report,
        companies: [{ stock_code: "A", risk_flags: [] }, { stock_code: "B" }],
      },
      "EVT_A",
    );
    expect(r.companies?.[0].risk_flags).toEqual([]);
    expect(r.companies?.[1].risk_flags).toBeNull();
  });
  it("isolates wrong-event evidence and retains invalid reference feedback", () => {
    const r = normalizeReport(
      {
        ...report,
        evidence: [{ evidence_id: "EVD_OTHER", event_id: "EVT_B" }],
        companies: [{ stock_code: "A", evidence_ids: ["EVD_OTHER"] }],
      },
      "EVT_A",
    );
    expect(r.evidence).toEqual([]);
    expect(
      resolveEvidenceReferences(r, ["EVD_OTHER"]).items[0].evidence,
    ).toBeNull();
    expect(r.issues).toContain("引用失效：EVD_OTHER");
  });
  it("deduplicates counts without pretending nodes have names or edges", () => {
    const r = composeFileMock(data, "EVT_A");
    expect(r.counts).toEqual({
      affected_nodes: 2,
      returned_companies: 1,
      evidence: 1,
    });
    expect(r.paths?.[0].node_ids).toEqual(["NODE_A", "NODE_B"]);
  });
  it("separates source credibility and verification status", () => {
    const r = composeFileMock(data, "EVT_A");
    expect(r.evidence?.[0]).toMatchObject({
      credibility_level: "A",
      verification_status: "pending_verification",
      is_mock: false,
    });
    expect(r.is_mock).toBe(true);
  });
  it("file Mock preserves supplied factors and does not forge a server run or conclusion", () => {
    const r = composeFileMock(data, "EVT_A");
    expect(r.companies?.[0]).toMatchObject({
      exposure: 88,
      sensitivity: 62,
      financial_materiality: 70,
      impact_score: 38.19,
    });
    expect(r.run_id).toBeNull();
    expect(r.generated_at).toBeNull();
    expect(r.conclusions).toBeNull();
    expect(r.provenance.server_run).toBe(false);
  });
  it("does not mine evidence quotation for company associations", () => {
    const d = structuredClone(data);
    d.evidence = [
      {
        evidence_id: "EVD_A",
        event_id: "EVT_A",
        stock_codes: [],
        quote: "000001.SZ",
      },
    ];
    const r = composeFileMock(d, "EVT_A");
    expect(r.companies?.[0].evidence_ids).toEqual([]);
    expect(r.companies?.[0].verification_status).toBe("pending_verification");
  });
  it("preserves source totals without frontend scoring and rejects invalid references/version", () => {
    expect(
      composeFileMock(
        {
          ...data,
          financial_scores: [
            { ...(data.financial_scores as object[])[0], impact_score: 90 },
          ],
        },
        "EVT_A",
      ).companies?.[0].impact_score,
    ).toBe(90);
    expect(() => composeFileMock(data, "EVT_A", "future")).toThrow("版本");
    expect(() => composeFileMock({ ...data, evidence: [] }, "EVT_A")).toThrow(
      "引用失效",
    );
  });
  it("permits only actual HTTP(S) links", () => {
    expect(safeSourceUrl("javascript:alert(1)")).toBeNull();
    expect(safeSourceUrl("https://example.com/source")).toBe(
      "https://example.com/source",
    );
  });
});
describe("request behavior", () => {
  it("posts the actual API contract and does not read bundled files", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(report)));
    const r = await createAnalysisAdapter("api", { fetch: fetcher }).analyze(
      "EVT_A",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]).toEqual([
      "/api/v1/analyze",
      expect.objectContaining({
        method: "POST",
        body: '{"event_id":"EVT_A","data_version":"mock-v1"}',
      }),
    ]);
    expect(r.mode).toBe("api");
  });
  it("422 remains a failure, never an empty result or automatic file fallback", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "unknown event" }), {
          status: 422,
        }),
    );
    await expect(
      createAnalysisAdapter("api", { fetch: fetcher }).analyze("EVT_A"),
    ).rejects.toMatchObject({
      kind: "http",
      status: 422,
      message: "unknown event",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("distinguishes network from unreadable success responses", async () => {
    await expect(
      createAnalysisAdapter("api", {
        fetch: vi.fn().mockRejectedValue(new TypeError()),
      }).analyze("EVT_A"),
    ).rejects.toMatchObject({ kind: "network" });
    await expect(
      createAnalysisAdapter("api", {
        fetch: vi.fn().mockResolvedValue(new Response("<html>")),
      }).analyze("EVT_A"),
    ).rejects.toMatchObject({ kind: "unreadable" });
  });
  it("rejects wrong-event reports", async () => {
    await expect(
      createAnalysisAdapter("api", {
        fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify(report))),
      }).analyze("EVT_B"),
    ).rejects.toMatchObject({ kind: "contract" });
  });
  it("invalidates stale responses even if the transport ignores abort", () => {
    const guard = new LatestRequestGuard();
    const a = guard.begin();
    const b = guard.begin();
    expect(a.signal.aborted).toBe(true);
    expect(a.current()).toBe(false);
    expect(b.current()).toBe(true);
    guard.invalidate();
    expect(b.current()).toBe(false);
  });
  it("preserves AbortError rather than reporting a network failure", async () => {
    await expect(
      createAnalysisAdapter("api", {
        fetch: vi
          .fn()
          .mockRejectedValue(new DOMException("aborted", "AbortError")),
      }).analyze("EVT_A"),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
