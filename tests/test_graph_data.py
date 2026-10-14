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

    def test_relation_type_and_condition_must_be_nonblank(self):
        for field in ("relation_type", "condition"):
            for value in ("", "   ", None):
                with self.subTest(field=field, value=value):
                    self.assert_invalid(lambda data: data[1][0].update({field: value}), "relations:")

    def test_relation_direction_must_be_supported(self):
        for value in ("", "   ", None, "up"):
            with self.subTest(value=value):
                self.assert_invalid(lambda data: data[1][0].update(effect_direction=value), "effect_direction")

    def test_rule_required_text_fields_cannot_be_missing_or_blank(self):
        fields = ("rule_id", "event_type", "trigger_node_id", "impact_direction", "exception", "source_title", "source_url", "verification_status")
        for field in fields:
            with self.subTest(field=field, missing=True):
                self.assert_invalid(lambda data: data[3][0].pop(field), f"{field} required")
            for value in ("", "   ", None, 123):
                with self.subTest(field=field, value=value):
                    self.assert_invalid(lambda data: data[3][0].update({field: value}), f"{field} required")

    def test_rule_direction_must_be_supported(self):
        self.assert_invalid(lambda data: data[3][0].update(impact_direction="up"), "invalid impact_direction")

    def test_rule_must_be_an_object(self):
        self.assert_invalid(lambda data: data[3].__setitem__(0, None), "each rule must be an object")

    def test_verified_rule_cannot_depend_on_pending_relation(self):
        self.assert_invalid(lambda data: data[3][0].update(verification_status="verified"), "depends on unverified relation")

    def test_verified_rule_with_verified_relations_is_accepted(self):
        data = copy.deepcopy(self.graph)
        rule = data[3][0]
        rule["verification_status"] = "verified"
        for relation in data[1]:
            if relation["relation_id"] in rule["relation_ids"]:
                relation["verification_status"] = "verified"
        self.assertEqual([], validate(*data))

    def test_subsidy_rule_stays_within_aviation_charging_scope(self):
        rule = next(rule for rule in self.graph[3] if rule["rule_id"] == "RULE_SUBSIDY_POLICY_V1")
        self.assertEqual(["NODE_EVTOL", "NODE_CHARGING_SWAP"], rule["path"])
        self.assertEqual(["REL_EVTOL_CHARGING"], rule["relation_ids"])
        self.assertIn("明确覆盖", rule["exception"])
        self.assertEqual("pending_verification", rule["verification_status"])


if __name__ == "__main__":
    unittest.main()
