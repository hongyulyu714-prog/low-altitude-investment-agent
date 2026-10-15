"""Deterministic orchestration for the mock end-to-end investment workflow."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

from contracts import Company, Evidence, Event, FinancialScore, GraphPath, Report, RunRecord
from contracts.models import CompanyImpact, Conclusion
from .scoring import calculate_impact_score


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MOCK_DIR = ROOT / "data" / "mock"
DEFAULT_RUN_DIR = ROOT / "data" / "runs"
DATA_VERSION = "mock-v1"


class OrchestrationError(ValueError):
    """A readable error for a missing or incompatible module payload."""


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

    def __init__(
        self,
        mock_dir: Path = DEFAULT_MOCK_DIR,
        run_dir: Path = DEFAULT_RUN_DIR,
        data_sources: Mapping[str, Path] | None = None,
    ) -> None:
        """Configure explicit version-to-directory mappings for agent data outputs.

        ``mock_dir`` remains a convenient override for the default ``mock-v1`` test
        dataset. Production integrations should pass ``data_sources`` and register
        every accepted version deliberately.
        """
        self.data_sources = (
            {version: Path(directory) for version, directory in data_sources.items()}
            if data_sources is not None
            else {DATA_VERSION: Path(mock_dir), "prototype-v1": ROOT / "data/versions/prototype-v1"}
        )
        self.run_dir = Path(run_dir)

    def analyze(self, event_id: str, data_version: str = DATA_VERSION) -> Report:
        run_id = f"RUN_{uuid.uuid4().hex[:12].upper()}"
        record = RunRecord.started(run_id, event_id, data_version)
        _save_run(record, self.run_dir)
        try:
            report = self._build_report(run_id, event_id, data_version)
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

    def _build_report(self, run_id: str, event_id: str, data_version: str) -> Report:
        data_directory = self._data_source_for(data_version)
        if data_version == "prototype-v1":
            from .versioned_data import build_report
            return build_report(data_directory, run_id, event_id, data_version)
        events = _validate_many(Event, _load_json(data_directory, "events.json"))
        paths = _validate_many(GraphPath, _load_json(data_directory, "graph_paths.json"))
        companies = _validate_many(Company, _load_json(data_directory, "companies.json"))
        scores = _validate_many(FinancialScore, _load_json(data_directory, "financial_scores.json"))
        evidence = _validate_many(Evidence, _load_json(data_directory, "evidence.json"))

        event = next((item for item in events if item.event_id == event_id), None)
        if event is None:
            raise OrchestrationError(f"找不到事件 {event_id}；请检查 event_id 或补充事件数据。")

        selected_paths = [item for item in paths if item.event_id == event_id]
        if not selected_paths:
            raise OrchestrationError(f"事件 {event_id} 没有可追溯的图谱路径。")
        selected_evidence = [item for item in evidence if item.event_id == event_id]
        evidence_ids = {item.evidence_id for item in selected_evidence}
        company_by_code = {item.stock_code: item for item in companies}
        self._validate_evidence_company_references(selected_evidence, company_by_code)
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
        self._validate_evidence_references("图谱路径", path_evidence, evidence_ids)

        conclusions = [
            Conclusion(
                conclusion_id="CONC_PATH_001",
                text=f"{event.event_name} 的示例传导路径已生成；全部数据均为 mock，须以真实来源替换后才能用于投资判断。",
                evidence_ids=sorted(path_evidence),
                verification_status="mock" if path_evidence else "pending_verification",
            ),
            Conclusion(
                conclusion_id="CONC_SCORE_001",
                text="公司影响分由暴露度、传导敏感度和财务重要性确定性计算；带 pending_verification 标记的结论不可视为已核验事实。",
                evidence_ids=sorted(evidence_ids),
                verification_status="mock" if evidence_ids else "pending_verification",
            ),
        ]
        self._validate_evidence_references(
            "结论", {evidence_id for conclusion in conclusions for evidence_id in conclusion.evidence_ids}, evidence_ids
        )
        return Report(
            report_id=f"RPT_{run_id.removeprefix('RUN_')}",
            run_id=run_id,
            data_version=data_version,
            event=event,
            paths=selected_paths,
            companies=impacts,
            evidence=selected_evidence,
            conclusions=conclusions,
            verification_status="mock",
            generated_at=datetime.now(timezone.utc),
        )

    def list_events(self, data_version: str) -> list[Event]:
        directory = self._data_source_for(data_version)
        if data_version == "prototype-v1":
            from .versioned_data import load_inputs, selected_event
            manifest, inputs = load_inputs(directory, data_version)
            return [selected_event(manifest, inputs)]
        return _validate_many(Event, _load_json(directory, "events.json"))

    def _data_source_for(self, data_version: str) -> Path:
        data_directory = self.data_sources.get(data_version)
        if data_directory is None:
            supported_versions = ", ".join(sorted(self.data_sources)) or "无"
            raise OrchestrationError(
                f"不支持的数据版本 {data_version}；可用版本：{supported_versions}。"
            )
        return data_directory

    @staticmethod
    def _validate_evidence_references(
        owner: str, referenced_evidence_ids: set[str], available_evidence_ids: set[str]
    ) -> None:
        unknown_evidence = referenced_evidence_ids - available_evidence_ids
        if unknown_evidence:
            raise OrchestrationError(
                f"{owner}引用了不存在的证据：{', '.join(sorted(unknown_evidence))}"
            )

    @staticmethod
    def _validate_evidence_company_references(
        evidence: list[Evidence], company_by_code: dict[str, Company]
    ) -> None:
        referenced_codes = {stock_code for item in evidence for stock_code in item.stock_codes}
        unknown_codes = referenced_codes - set(company_by_code)
        if unknown_codes:
            raise OrchestrationError(
                f"证据引用了公司映射中不存在的证券代码：{', '.join(sorted(unknown_codes))}"
            )

    @staticmethod
    def _evidence_for_company(stock_code: str, evidence: list[Evidence]) -> list[str]:
        return [item.evidence_id for item in evidence if stock_code in item.stock_codes]


def run_demo() -> str:
    """CLI entry point used by the README and smoke test."""
    report = InvestmentOrchestrator().analyze("EVT_BATTERY_PRICE_DOWN_001")
    return report.model_dump_json(indent=2)


if __name__ == "__main__":
    print(run_demo())
