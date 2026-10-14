import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate_evidence import load, validate


class EvidenceCorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus = load()

    def assert_invalid(self, mutate, fragment):
        data = copy.deepcopy(self.corpus)
        mutate(data)
        errors = validate(*data)
        self.assertTrue(any(fragment in e for e in errors), fragment)
        return errors

    def test_corpus_meets_quotas_and_references(self):
        self.assertEqual([], validate(*self.corpus))

    def test_duplicate_id_rejected(self):
        self.assert_invalid(lambda d: d[0][1].update(event_id=d[0][0]['event_id']), 'duplicate IDs')

    def test_dangling_evidence_rejected(self):
        self.assert_invalid(lambda d: d[1][0].update(event_id='EVT_MISSING'), 'dangling event')

    def test_missing_quote_rejected(self):
        self.assert_invalid(lambda d: d[1][0].update(quote=''), 'short excerpt')

    def test_invalid_calendar_date_rejected(self):
        self.assert_invalid(lambda d: d[0][0].update(event_date='2024-02-30'), 'invalid event_date')

    def test_future_dates_cannot_be_authorized_by_forged_generated_at(self):
        def forge_future_dates(data):
            data[4]['generated_at'] = '9999-12-31'
            data[0][0]['event_date'] = '2099-01-01'
            data[1][0]['published_date'] = '2099-01-01'
            data[4]['records'][0]['reviewed_at'] = '2099-01-01'

        errors = self.assert_invalid(forge_future_dates, 'invalid generated_at')
        self.assertTrue(any('invalid event_date' in error for error in errors))
        self.assertTrue(any('invalid published_date' in error for error in errors))
        self.assertTrue(any('review lacks date/basis' in error for error in errors))

    def test_unknown_node_rejected(self):
        self.assert_invalid(lambda d: d[3][0]['expected_path'].append('NODE_UNKNOWN'), 'unknown/short expected path')

    def test_unknown_required_evidence_rejected(self):
        self.assert_invalid(lambda d: d[3][0]['required_evidence_ids'].append('EVD_MISSING'), 'unknown/repeated evidence')

    def test_secondary_source_cannot_be_verified(self):
        self.assert_invalid(lambda d: d[0][0].update(source_level='C'), 'verified event needs primary')

    def test_missing_category_fails_quota(self):
        self.assert_invalid(lambda d: d[0].__setitem__(slice(None), [e for e in d[0] if e['event_type'] != 'material']), 'material: requires')

    def test_forecast_path_cannot_claim_graph_validation(self):
        self.assert_invalid(lambda d: d[3][0].update(path_status='verified'), 'must remain a hypothesis')

    def test_cross_period_comparison_has_both_sources(self):
        case = next(c for c in self.corpus[3] if c['case_id'] == 'CASE_008')
        self.assertEqual(['EVD_003_BASE', 'EVD_008'], case['required_evidence_ids'])

    def test_production_certificate_uses_regulator_issue_date(self):
        event = next(e for e in self.corpus[0] if e['event_id'] == 'EVT_007')
        self.assertEqual('2024-03-28', event['event_date'])
        item = next(e for e in self.corpus[1] if e['event_id'] == 'EVT_007')
        self.assertEqual('2024-04-16', item['published_date'])

    def test_sample_must_be_reproducible(self):
        self.assert_invalid(lambda d: d[4].update(sampled_event_ids=[]), 'sample is not reproducible')

    def test_review_must_reference_matching_evidence(self):
        self.assert_invalid(lambda d: d[4]['records'][0].update(evidence_ids=['EVD_030']), 'review evidence IDs mismatch')


if __name__ == '__main__':
    unittest.main()
