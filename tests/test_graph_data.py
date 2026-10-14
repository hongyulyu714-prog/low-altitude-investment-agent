import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from validate_graph_data import load, validate


class GraphDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = load()

    def assert_invalid(self, mutate, fragment):
        data = copy.deepcopy(self.graph)
        mutate(data)
        errors = validate(*data)
        self.assertTrue(any(fragment in error for error in errors), errors)

    def test_graph_meets_issue_two_acceptance_contract(self):
        self.assertEqual([], validate(*self.graph))

    def test_dangling_relation_is_rejected(self):
        self.assert_invalid(lambda data: data[1][0].update(to_node_id="NODE_UNKNOWN"), "dangling node")

    def test_company_group_quota_is_rejected_when_changed(self):
        self.assert_invalid(lambda data: data[2][0].update(chain_role="运营应用"), "five records")

    def test_rule_path_must_follow_its_relations(self):
        self.assert_invalid(lambda data: data[3][0]["path"].__setitem__(1, "NODE_EVTOL"), "does not connect")

    def test_required_event_category_cannot_be_removed(self):
        self.assert_invalid(lambda data: data[3][3].update(event_type="其他"), "mandatory event types")


if __name__ == "__main__":
    unittest.main()
