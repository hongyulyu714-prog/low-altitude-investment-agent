"""Small HTTP surface that the frontend can replace mocks with incrementally."""

from fastapi import FastAPI, HTTPException

from contracts import AnalysisRequest, Report
from .orchestrator import DATA_VERSION, InvestmentOrchestrator, OrchestrationError

app = FastAPI(title="低空智研总控 Agent", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "data_version": DATA_VERSION}


@app.post("/api/v1/analyze", response_model=Report)
def analyze(request: AnalysisRequest) -> Report:
    try:
        return InvestmentOrchestrator().analyze(request.event_id, request.data_version)
    except OrchestrationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
