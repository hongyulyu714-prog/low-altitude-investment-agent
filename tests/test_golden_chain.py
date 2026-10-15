"""Request -> pinned corpus -> graph/mapping -> scoring -> traceable report."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from backend.main import app
from backend.orchestrator import InvestmentOrchestrator, OrchestrationError, ROOT
from backend.scoring import calculate_impact_score


class GoldenChainTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.runner = InvestmentOrchestrator(run_dir=Path(self.temp.name) / 'runs')
        self.client = TestClient(app)
        self.mock = patch('backend.main.InvestmentOrchestrator', return_value=self.runner)
        self.mock.start()
        self.addCleanup(self.mock.stop)

    def test_full_request_to_report(self):
        events = self.client.get('/api/v1/events', params={'data_version': 'prototype-v1'})
        self.assertEqual(events.status_code, 200)
        self.assertEqual([e['event_id'] for e in events.json()], ['EVT_002'])
        response = self.client.post('/api/v1/analyze', json={'event_id':'EVT_002', 'data_version':'prototype-v1'})
        self.assertEqual(response.status_code, 200, response.text)
        report = response.json()
        self.assertEqual(report['data_version'], 'prototype-v1')
        self.assertEqual(report['verification_status'], 'pending_verification')
        self.assertEqual(report['paths'][0]['node_ids'], ['NODE_EVTOL', 'NODE_VERTIPORT', 'NODE_LOW_ALTITUDE_LOGISTICS'])
        self.assertEqual({c['stock_code'] for c in report['companies']}, {'300284.SZ','002111.SZ','002352.SZ'})
        evidence = {e['evidence_id']:e for e in report['evidence']}
        self.assertEqual(evidence['EVD_002']['verification_status'], 'verified')
        for item in report['paths'] + report['companies'] + report['conclusions']:
            self.assertTrue(item['evidence_ids'])
            self.assertLessEqual(set(item['evidence_ids']), set(evidence))
        for c in report['companies']:
            self.assertLessEqual(set(c['node_ids']), set(report['paths'][0]['node_ids']))
            self.assertEqual(c['verification_status'], 'pending_verification')
            if c['stock_code'] == '002111.SZ':
                self.assertIsNone(c['impact_score'])
                self.assertIn('financial_inputs_unavailable', c['risk_flags'])
            else:
                self.assertEqual(c['impact_score'], calculate_impact_score(c['exposure'], c['sensitivity'], c['financial_materiality']))
                self.assertIn('mock_data', c['risk_flags'])
        record = json.loads((Path(self.temp.name) / 'runs' / (report['run_id'] + '.json')).read_text())
        self.assertEqual(record['status'], 'completed')
        self.assertEqual(record['data_version'], 'prototype-v1')

    def test_no_version_or_event_fallback(self):
        for event, version in [('EVT_002','unknown'), ('EVT_BATTERY_PRICE_DOWN_001','prototype-v1')]:
            response = self.client.post('/api/v1/analyze', json={'event_id':event, 'data_version':version})
            self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get('/api/v1/events?data_version=unknown').status_code, 422)

    def test_pinned_inputs_cannot_drift(self):
        directory = Path(self.temp.name) / 'version'
        directory.mkdir()
        manifest = json.loads((ROOT / 'data/versions/prototype-v1/manifest.json').read_text())
        manifest['files']['data/events.csv'] = '0' * 64
        (directory / 'manifest.json').write_text(json.dumps(manifest))
        runner = InvestmentOrchestrator(run_dir=Path(self.temp.name)/'runs', data_sources={'prototype-v1':directory})
        with self.assertRaisesRegex(OrchestrationError, '校验失败'):
            runner.analyze('EVT_002','prototype-v1')
