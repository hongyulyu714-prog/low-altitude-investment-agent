"""Deterministic orchestration for the mock end-to-end investment workflow."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from contracts import Company, Evidence, Event, FinancialScore, GraphPath, Report, RunRecord
from contracts.models import CompanyImpact, Conclusion


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MOCK_DIR = ROOT / "data" / "mock"
DEFAULT_RUN_DIR = ROOT / "data" / "runs"
DATA_VERSION = "mock-v1"


class OrchestrationError(ValueError):
    """A readable error for a missing or incompatible module payload."""


def calculate_impact_score(exposure: float, sensitivity: float, financial_materiality: float) -> float:
    """The published v1 formula: three normalized factors scaled back to 0–100."""
    return round(exposure * sensitivity * financial_materiality / 10_000, 2)


def _load_json(directory: Path, name: str) -> object:
    path = directory / name
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise OrchestrationError(f"缺少 mock 数据文件：{path}") from exc
    except json.JSONDecodeError as exc:
        raise OrchestrationError(f"mock 数据不是有效 JSON：{path}") from exc


def _validate_many(model: type, payload: object) -> list:
    if not isinstance(payload, list):
        raise OrchestrationError(f"{model.__name__} 数据应为 JSON 数组")
    try:
        return [model.model_validate(item) for item in payload]
    except Exception as exc:  # pydantic exposes detailed field errors to callers
        raise OrchestrationError(f"{model.__name__} 数据不符合接口：{exc}") from exc


def _save_run(record: RunRecord, run_dir: Path) -> None:
    run_dir.mkdir(parents=True, exist_ok=True)
    destination = run_dir / f"{record.run_id}.json"
    destination.write_text(record.model_dump_json(indent=2), encoding="utf-8")


class InvestmentOrchestrator:
    """Loads replaceable agent outputs, validates them, and makes one report."""

    def __init__(self, mock_dir: Path = DEFAULT_MOCK_DIR, run_dir: Path = DEFAULT_RUN_DIR) -> None:
        self.mock_dir = Path(mock_dir)
        self.run_dir = Path(run_dir)

    def analyze(self, event_id: str, data_version: str = DATA_VERSION) -> Report:
        run_id = f"RUN_{uuid.uuid4().hex[:12].upper()}"
        record = RunRecord.started(run_id, event_id, data_version)
        _save_run(record, self.run_dir)
        try:
            report = self._build_report(run_id, event_id)
        except Exception as exc:
            failed = record.model_copy(
                update={
                    "completed_at": datetime.now(timezone.utc),
                    "status": "failed",
                    "error": str(exc),
                }
            )
            _save_run(failed, self.run_dir)
            if isinstance(exc, OrchestrationError):
                raise
            raise OrchestrationError(f"总控运行失败：{exc}") from exc

        completed = record.model_copy(
            update={
                "completed_at": datetime.now(timezone.utc),
                "status": "completed",
                "report_id": report.report_id,
            }
        )
        _save_run(completed, self.run_dir)
        return report

    def _build_report(self, run_id: str, event_id: str) -> Report:
        events = _validate_many(Event, _load_json(self.mock_dir, "events.json"))
        paths = _validate_many(GraphPath, _load_json(self.mock_dir, "graph_paths.json"))
        companies = _validate_many(Company, _load_json(self.mock_dir, "companies.json"))
        scores = _validate_many(FinancialScore, _load_json(self.mock_dir, "financial_scores.json"))
        evidence = _validate_many(Evidence, _load_json(self.mock_dir, "evidence.json"))

        event = next((item for item in events if item.event_id == event_id), None)
        if event is None:
            raise OrchestrationError(f"找不到事件 {event_id}；请检查 event_id 或补充事件数据。")

        selected_paths = [item for item in paths if item.event_id == event_id]
        if not selected_paths:
            raise OrchestrationError(f"事件 {event_id} 没有可追溯的图谱路径。")
        selected_evidence = [item for item in evidence if item.event_id == event_id]
        evidence_ids = {item.evidence_id for item in selected_evidence}
        company_by_code = {item.stock_code: item for item in companies}
        selected_scores = [item for item in scores if item.event_id == event_id]

        impacts: list[CompanyImpact] = []
        for score in sorted(selected_scores, key=lambda item: item.impact_score, reverse=True):
            expected_score = calculate_impact_score(
                score.exposure, score.sensitivity, score.financial_materiality
            )
            if abs(score.impact_score - expected_score) > 0.01:
                raise OrchestrationError(
                    f"{score.stock_code} 的影响评分与 {score.formula_version} 不一致；"
                    f"应为 {expected_score}，实际为 {score.impact_score}。"
                )
            company = company_by_code.get(score.stock_code)
            if company is None:
                raise OrchestrationError(f"评分中的证券代码 {score.stock_code} 不存在于公司映射。")
            linked_evidence = self._evidence_for_company(score.stock_code, selected_evidence)
            has_evidence = bool(linked_evidence)
            impacts.append(
                CompanyImpact(
                    stock_code=company.stock_code,
                    company_name=company.company_name,
                    chain_role=company.chain_role,
                    impact_direction=score.impact_direction,
                    impact_score=score.impact_score,
                    risk_flags=score.risk_flags + ([] if has_evidence else ["pending_verification"]),
                    evidence_ids=linked_evidence,
                    verification_status="mock" if has_evidence else "pending_verification",
                )
            )

        path_evidence = {evidence_id for path in selected_paths for evidence_id in path.evidence_ids}
        unknown_evidence = path_evidence - evidence_ids
        if unknown_evidence:
            raise OrchestrationError(f"图谱路径引用了不存在的证据：{', '.join(sorted(unknown_evidence))}")

        conclusions = [
            Conclusion(
                conclusion_id="CONC_PATH_001",
                text=f"{event.event_name} 的示例传导路径已生成；全部数据均为 mock，须以真实来源替换后才能用于投资判断。",
                evidence_ids=sorted(path_evidence),
                verification_status="mock",
            ),
            Conclusion(
                conclusion_id="CONC_SCORE_001",
                text="公司影响分由暴露度、传导敏感度和财务重要性确定性计算；带 pending_verification 标记的结论不可视为已核验事实。",
                evidence_ids=["EVD_RISK_001"],
                verification_status="mock",
            ),
        ]
        return Report(
            report_id=f"RPT_{run_id.removeprefix('RUN_')}",
            run_id=run_id,
            event=event,
            paths=selected_paths,
            companies=impacts,
            evidence=selected_evidence,
            conclusions=conclusions,
            verification_status="mock",
            generated_at=datetime.now(timezone.utc),
        )

    @staticmethod
    def _evidence_for_company(stock_code: str, evidence: list[Evidence]) -> list[str]:
        return [item.evidence_id for item in evidence if stock_code in item.quote]


def run_demo() -> str:
    """CLI entry point used by the README and smoke test."""
    report = InvestmentOrchestrator().analyze("EVT_BATTERY_PRICE_DOWN_001")
    return report.model_dump_json(indent=2)


if __name__ == "__main__":
    print(run_demo())
