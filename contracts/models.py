"""The public JSON contracts exchanged between the four agents and the UI."""

from __future__ import annotations

from datetime import date, datetime, timezone
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


VerificationStatus = Literal["verified", "pending_verification", "mock"]
ImpactDirection = Literal["positive", "negative", "neutral", "uncertain"]
STOCK_CODE_PATTERN = re.compile(r"^\d{6}\.(SZ|SH|BJ)$")


class ContractModel(BaseModel):
    """Forbid silent interface drift between independently built modules."""

    model_config = ConfigDict(extra="forbid")


class Event(ContractModel):
    event_id: str = Field(pattern=r"^EVT_[A-Z0-9_]+$")
    event_name: str = Field(min_length=1)
    event_type: str = Field(min_length=1)
    event_date: date
    direction: str = Field(min_length=1)
    affected_node_ids: list[str] = Field(min_length=1)
    source_title: str = Field(min_length=1)
    source_url: HttpUrl
    verification_status: VerificationStatus


class GraphPath(ContractModel):
    path_id: str = Field(pattern=r"^PATH_[A-Z0-9_]+$")
    event_id: str = Field(pattern=r"^EVT_[A-Z0-9_]+$")
    node_ids: list[str] = Field(min_length=2)
    relation_ids: list[str] = Field(min_length=1)
    rule_id: str = Field(min_length=1)
    impact_direction: ImpactDirection
    evidence_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def relation_count_must_connect_all_nodes(self) -> "GraphPath":
        if len(self.relation_ids) != len(self.node_ids) - 1:
            raise ValueError("relation_ids 的数量必须等于 node_ids 的数量减一")
        return self


class Company(ContractModel):
    company_id: str = Field(pattern=r"^COMP_[A-Z0-9_]+$")
    stock_code: str = Field(pattern=r"^\d{6}\.(SZ|SH|BJ)$")
    company_name: str = Field(min_length=1)
    chain_role: str = Field(min_length=1)
    exposure_score: float = Field(ge=0, le=100)
    verification_status: VerificationStatus


class FinancialScore(ContractModel):
    stock_code: str = Field(pattern=r"^\d{6}\.(SZ|SH|BJ)$")
    event_id: str = Field(pattern=r"^EVT_[A-Z0-9_]+$")
    exposure: float = Field(ge=0, le=100)
    sensitivity: float = Field(ge=0, le=100)
    financial_materiality: float = Field(ge=0, le=100)
    impact_score: float = Field(ge=0, le=100)
    formula_version: str = Field(min_length=1)
    risk_flags: list[str] = Field(default_factory=list)
    impact_direction: ImpactDirection


class Evidence(ContractModel):
    evidence_id: str = Field(pattern=r"^EVD_[A-Z0-9_]+$")
    event_id: str = Field(pattern=r"^EVT_[A-Z0-9_]+$")
    source_title: str = Field(min_length=1)
    published_date: date | None = None
    source_url: HttpUrl
    quote: str = Field(min_length=1)
    stock_codes: list[str] = Field(default_factory=list)
    credibility_level: Literal["A", "B", "C", "D", "mock"]
    verification_status: VerificationStatus

    @field_validator("stock_codes")
    @classmethod
    def stock_codes_must_be_unique_and_well_formed(cls, values: list[str]) -> list[str]:
        invalid_codes = [code for code in values if not STOCK_CODE_PATTERN.fullmatch(code)]
        if invalid_codes:
            raise ValueError(f"stock_codes 包含无效证券代码：{', '.join(invalid_codes)}")
        if len(values) != len(set(values)):
            raise ValueError("stock_codes 不能包含重复证券代码")
        return values


class CompanyImpact(ContractModel):
    stock_code: str
    company_name: str
    chain_role: str
    impact_direction: ImpactDirection
    impact_score: float = Field(ge=0, le=100)
    risk_flags: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)
    verification_status: VerificationStatus


class Conclusion(ContractModel):
    conclusion_id: str = Field(pattern=r"^CONC_[A-Z0-9_]+$")
    text: str = Field(min_length=1)
    evidence_ids: list[str] = Field(default_factory=list)
    verification_status: VerificationStatus


class Report(ContractModel):
    report_id: str = Field(pattern=r"^RPT_[A-Z0-9_]+$")
    run_id: str
    data_version: str = Field(min_length=1)
    event: Event
    paths: list[GraphPath]
    companies: list[CompanyImpact]
    evidence: list[Evidence]
    conclusions: list[Conclusion]
    verification_status: VerificationStatus
    generated_at: datetime

    @field_validator("generated_at")
    @classmethod
    def timestamp_must_include_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("generated_at must include a timezone")
        return value


class AnalysisRequest(ContractModel):
    event_id: str = Field(default="EVT_BATTERY_PRICE_DOWN_001")
    data_version: str = Field(default="mock-v1")


class RunRecord(ContractModel):
    run_id: str
    event_id: str
    data_version: str
    started_at: datetime
    completed_at: datetime | None = None
    status: Literal["running", "completed", "failed"]
    error: str | None = None
    report_id: str | None = None

    @classmethod
    def started(cls, run_id: str, event_id: str, data_version: str) -> "RunRecord":
        return cls(
            run_id=run_id,
            event_id=event_id,
            data_version=data_version,
            started_at=datetime.now(timezone.utc),
            status="running",
        )
