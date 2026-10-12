import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import app
from backend.orchestrator import InvestmentOrchestrator


class ApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        runner = InvestmentOrchestrator(run_dir=Path(self.temporary_directory.name) / "runs")
        self.orchestrator_patch = patch("backend.main.InvestmentOrchestrator", return_value=runner)
        self.orchestrator_patch.start()
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.orchestrator_patch.stop()
        self.temporary_directory.cleanup()

    def test_health_reports_active_data_version(self) -> None:
        response = self.client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "data_version": "mock-v1"})

    def test_analyze_returns_report_for_registered_version(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            json={"event_id": "EVT_BATTERY_PRICE_DOWN_001", "data_version": "mock-v1"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data_version"], "mock-v1")

    def test_analyze_returns_422_for_unknown_version(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            json={"event_id": "EVT_BATTERY_PRICE_DOWN_001", "data_version": "not-a-real-version"},
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("不支持的数据版本", response.json()["detail"])
