import eventsUrl from "../../../data/mock/events.json?url";
import pathsUrl from "../../../data/mock/graph_paths.json?url";
import companiesUrl from "../../../data/mock/companies.json?url";
import scoresUrl from "../../../data/mock/financial_scores.json?url";
import evidenceUrl from "../../../data/mock/evidence.json?url";
import { composeFileMock, normalizeEvent, normalizeReport } from "./normalize";
import type { DataMode, FileMockData, ReportView } from "./types";
export * from "./types";
export * from "./normalize";
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly kind: "http" | "network" | "unreadable" | "contract",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AdapterError";
  }
}
export interface AdapterOptions {
  fetch?: typeof fetch;
  baseUrl?: string;
}
const isAbort = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";
async function readJson(
  fetcher: typeof fetch,
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(url, init);
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new AdapterError("无法连接数据源，请检查网络或后端服务", "network");
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (isAbort(error)) throw error;
    if (!response.ok)
      throw new AdapterError(
        `请求失败（HTTP ${response.status}），响应内容不可读`,
        "http",
        response.status,
      );
    throw new AdapterError("响应不是可读的 JSON 数据", "unreadable");
  }
  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail: unknown }).detail
        : null;
    throw new AdapterError(
      typeof detail === "string"
        ? detail
        : `请求失败（HTTP ${response.status}）${detail ? "：" + JSON.stringify(detail) : ""}`,
      "http",
      response.status,
    );
  }
  return payload;
}
/** Both modes are selected explicitly. An API failure never falls back to bundled Mock files. */
export function createAnalysisAdapter(
  mode: DataMode,
  options: AdapterOptions = {},
) {
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const base = (options.baseUrl ?? "").replace(/\/$/, "");
  return {
    mode,
    async listEvents(signal?: AbortSignal) {
      const payload = await readJson(fetcher, eventsUrl, { signal });
      if (!Array.isArray(payload))
        throw new AdapterError("事件列表不是有效数组", "contract");
      try {
        return payload.map(normalizeEvent);
      } catch (error) {
        throw new AdapterError(
          error instanceof Error ? error.message : "事件列表无效",
          "contract",
        );
      }
    },
    async analyze(
      eventId: string,
      signal?: AbortSignal,
      version = "mock-v1",
    ): Promise<ReportView> {
      if (!eventId) throw new AdapterError("请先选择事件", "contract");
      if (mode === "api") {
        const payload = await readJson(fetcher, `${base}/api/v1/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId, data_version: version }),
          signal,
        });
        try {
          return normalizeReport(payload, eventId);
        } catch (error) {
          throw new AdapterError(
            error instanceof Error ? error.message : "报告契约无效",
            "contract",
          );
        }
      }
      const urls = {
        events: eventsUrl,
        graph_paths: pathsUrl,
        companies: companiesUrl,
        financial_scores: scoresUrl,
        evidence: evidenceUrl,
      };
      const entries = await Promise.all(
        Object.entries(urls).map(
          async ([key, url]) =>
            [key, await readJson(fetcher, url, { signal })] as const,
        ),
      );
      try {
        return composeFileMock(
          Object.fromEntries(entries) as unknown as FileMockData,
          eventId,
          version,
        );
      } catch (error) {
        throw new AdapterError(
          error instanceof Error ? error.message : "Mock 文件组合失败",
          "contract",
        );
      }
    },
  };
}
/** Consumers invalidate immediately on event/mode change and commit results only for the returned token. */
export class LatestRequestGuard {
  private epoch = 0;
  private controller: AbortController | null = null;
  invalidate() {
    this.epoch++;
    this.controller?.abort();
    this.controller = null;
  }
  begin() {
    this.invalidate();
    this.controller = new AbortController();
    const epoch = this.epoch;
    return {
      signal: this.controller.signal,
      current: () => epoch === this.epoch && !this.controller?.signal.aborted,
    };
  }
}
