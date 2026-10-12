import json
import tempfile
import unittest
from pathlib import Path

from backend.orchestrator import DEFAULT_MOCK_DIR, InvestmentOrchestrator, OrchestrationError


class OrchestratorTests(unittest.TestCase):
    def test_demo_produces_traceable_report_and_run_record(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            runner = InvestmentOrchestrator(run_dir=Path(temp_dir))
            report = runner.analyze("EVT_BATTERY_PRICE_DOWN_001")

            self.assertTrue(report.run_id.startswith("RUN_"))
            self.assertEqual(report.data_version, "mock-v1")
            self.assertEqual(report.event.event_id, "EVT_BATTERY_PRICE_DOWN_001")
            self.assertEqual(len(report.paths), 1)
            self.assertEqual(len(report.companies), 3)
            self.assertTrue(all(company.evidence_ids for company in report.companies))
            self.assertTrue(all(conclusion.evidence_ids for conclusion in report.conclusions))
            record = json.loads((Path(temp_dir) / f"{report.run_id}.json").read_text())
            self.assertEqual(record["status"], "completed")
            self.assertEqual(record["report_id"], report.report_id)

    def test_unknown_event_creates_a_readable_error(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            runner = InvestmentOrchestrator(run_dir=Path(temp_dir))
            with self.assertRaisesRegex(OrchestrationError, "找不到事件"):
                runner.analyze("EVT_UNKNOWN")

    def test_missing_evidence_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            mock_dir = Path(temp_dir) / "mock"
            mock_dir.mkdir()
            for source in DEFAULT_MOCK_DIR.glob("*.json"):
                (mock_dir / source.name).write_text(source.read_text())
            paths_path = mock_dir / "graph_paths.json"
            paths = json.loads(paths_path.read_text())
            paths[0]["evidence_ids"] = ["EVD_DOES_NOT_EXIST"]
            paths_path.write_text(json.dumps(paths))
            with self.assertRaisesRegex(OrchestrationError, "不存在的证据"):
                InvestmentOrchestrator(mock_dir=mock_dir, run_dir=Path(temp_dir) / "runs").analyze(
                    "EVT_BATTERY_PRICE_DOWN_001"
                )

    def test_inconsistent_score_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            mock_dir = Path(temp_dir) / "mock"
            mock_dir.mkdir()
            for source in DEFAULT_MOCK_DIR.glob("*.json"):
                (mock_dir / source.name).write_text(source.read_text())
            scores_path = mock_dir / "financial_scores.json"
            scores = json.loads(scores_path.read_text())
            scores[0]["impact_score"] = 99
            scores_path.write_text(json.dumps(scores))
            with self.assertRaisesRegex(OrchestrationError, "评分与"):
                InvestmentOrchestrator(mock_dir=mock_dir, run_dir=Path(temp_dir) / "runs").analyze(
                    "EVT_BATTERY_PRICE_DOWN_001"
                )

    def test_unknown_data_version_is_rejected_and_recorded_as_failed(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            run_dir = Path(temp_dir) / "runs"
            runner = InvestmentOrchestrator(run_dir=run_dir)
            with self.assertRaisesRegex(OrchestrationError, "不支持的数据版本 not-a-real-version"):
                runner.analyze("EVT_BATTERY_PRICE_DOWN_001", "not-a-real-version")

            record = next(run_dir.glob("RUN_*.json"))
            payload = json.loads(record.read_text())
            self.assertEqual(payload["data_version"], "not-a-real-version")
            self.assertEqual(payload["status"], "failed")

    def test_registered_data_version_selects_its_own_data_source(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            versioned_mock_dir = Path(temp_dir) / "versioned-mock"
            versioned_mock_dir.mkdir()
            for source in DEFAULT_MOCK_DIR.glob("*.json"):
                (versioned_mock_dir / source.name).write_text(source.read_text())
            events_path = versioned_mock_dir / "events.json"
            events = json.loads(events_path.read_text())
            events[0]["event_name"] = "版本 v2 的模拟事件"
            events_path.write_text(json.dumps(events))

            report = InvestmentOrchestrator(
                run_dir=Path(temp_dir) / "runs", data_sources={"mock-v2": versioned_mock_dir}
            ).analyze("EVT_BATTERY_PRICE_DOWN_001", "mock-v2")

            self.assertEqual(report.data_version, "mock-v2")
            self.assertEqual(report.event.event_name, "版本 v2 的模拟事件")

    def test_conclusions_do_not_reference_removed_risk_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            mock_dir = Path(temp_dir) / "mock"
            mock_dir.mkdir()
            for source in DEFAULT_MOCK_DIR.glob("*.json"):
                (mock_dir / source.name).write_text(source.read_text())
            evidence_path = mock_dir / "evidence.json"
            evidence = json.loads(evidence_path.read_text())
            evidence_path.write_text(json.dumps([item for item in evidence if item["evidence_id"] != "EVD_RISK_001"]))

            report = InvestmentOrchestrator(mock_dir=mock_dir, run_dir=Path(temp_dir) / "runs").analyze(
                "EVT_BATTERY_PRICE_DOWN_001"
            )

            available_ids = {item.evidence_id for item in report.evidence}
            referenced_ids = {evidence_id for conclusion in report.conclusions for evidence_id in conclusion.evidence_ids}
            self.assertTrue(referenced_ids)
            self.assertTrue(referenced_ids.issubset(available_ids))


if __name__ == "__main__":
    unittest.main()
