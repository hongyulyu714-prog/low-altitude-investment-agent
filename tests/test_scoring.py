import copy
import json
from pathlib import Path
import tempfile
import unittest
from backend.scoring import (calculate_impact_score, financial_materiality, score_company,
                             run, rank_scores, to_financial_score, load_financials, validate_dataset)
from backend.generate_scoring_examples import generate

ROOT=Path(__file__).resolve().parents[1]

class ScoringTests(unittest.TestCase):
    def setUp(self):
        self.c=dict(stock_code='000099.SZ',company_name='模拟公司',chain_role='operations',exposure_score=80,verification_status='mock',source_url='https://example.invalid/mock')
        self.f=dict(stock_code='000099.SZ',revenue=100,gross_margin=20,operating_cash_flow=10,asset_liability_ratio=40,verification_status='mock',source_url='https://example.invalid/mock')

    def test_product_and_bounds(self):
        self.assertEqual(calculate_impact_score(80,50,40),16)
        self.assertEqual(calculate_impact_score(100,100,100),100)
        self.assertEqual(calculate_impact_score(0,100,100),0)
        self.assertIsNone(calculate_impact_score(None,100,100))
        for invalid in (-1,101,float('nan'),float('inf'),True,'80'):
            with self.assertRaises(ValueError): calculate_impact_score(invalid,50,50)

    def test_financial_hand_calculation(self):
        score,parts,_=financial_materiality(self.f)
        self.assertEqual(parts,dict(margin_pressure=60,cashflow_pressure=25,leverage=40))
        self.assertEqual(score,42.75)

    def test_missing_and_zero_are_distinct(self):
        for field in ('revenue','gross_margin','operating_cash_flow','asset_liability_ratio'):
            f=dict(self.f,**{field:None})
            self.assertIsNone(financial_materiality(f)[0])
        self.assertIsNone(financial_materiality(dict(self.f,revenue=0))[0])
        self.assertIsNotNone(financial_materiality(dict(self.f,operating_cash_flow=0))[0])

    def test_mock_requires_opt_in(self):
        with self.assertRaises(ValueError): score_company(self.c,self.f,'EVT_POLICY_SUPPORT')

    def test_unverified_mapping_stays_unknown(self):
        c=dict(self.c,verification_status='pending_verification')
        r=score_company(c,self.f,'EVT_POLICY_SUPPORT',allow_mock=True)
        self.assertIsNone(r['impact_score'])
        with self.assertRaises(ValueError): to_financial_score(r)
        self.assertIsNone(rank_scores([r])[0]['rank'])

    def test_real_rule_must_be_verified(self):
        c=dict(self.c,verification_status='verified')
        f=dict(self.f,verification_status='verified')
        self.assertIsNone(score_company(c,f,'EVT_POLICY_SUPPORT')['impact_score'])
        c['event_rules']={'EVT_POLICY_SUPPORT':dict(sensitivity=50,impact_direction='positive',source_url='https://example.org/rule',verification_status='verified')}
        self.assertEqual(score_company(c,f,'EVT_POLICY_SUPPORT')['impact_score'],17.1)

    def test_negative_financials_and_sensitivity(self):
        base=score_company(self.c,self.f,'EVT_POLICY_SUPPORT',allow_mock=True)
        worse=score_company(self.c,dict(self.f,operating_cash_flow=-10),'EVT_POLICY_SUPPORT',allow_mock=True)
        self.assertGreater(worse['impact_score'],base['impact_score'])
        lower=score_company(dict(self.c,exposure_score=40),self.f,'EVT_POLICY_SUPPORT',allow_mock=True)
        self.assertAlmostEqual(lower['impact_score'],base['impact_score']/2,places=2)

    def test_example_reproducible_and_complete(self):
        data=ROOT/'data'
        actual=run(data/'financials.example.csv',data/'scoring_companies.example.json',allow_mock=True)
        self.assertEqual(actual,json.loads((data/'company_impact.example.json').read_text()))
        self.assertEqual(len(actual),3)
        for ranking in actual.values():
            self.assertEqual(len(ranking),20)
            self.assertTrue(all(r['verification_status']=='mock' for r in ranking))
            from contracts import FinancialScore
            for r in ranking: FinancialScore.model_validate(to_financial_score(r))
        with tempfile.TemporaryDirectory() as tmp:
            generate(Path(tmp))
            for name in ('financials.example.csv','company_impact.example.json','company_universe.provisional.json'):
                self.assertEqual((Path(tmp)/name).read_bytes(),(data/name).read_bytes())

    def test_dataset_rejects_bad_coverage_dates_and_units(self):
        data=ROOT/'data'; records=load_financials(data/'financials.example.csv')
        companies=json.loads((data/'scoring_companies.example.json').read_text())
        for mutation in ('duplicate','missing','date','unit','nan'):
            rows=copy.deepcopy(records)
            if mutation=='duplicate': rows.append(rows[0])
            if mutation=='missing': rows.pop(0)
            if mutation=='date': next(r for r in rows if r['period_type']=='market')['as_of_date']='2026-10-12'
            if mutation=='unit': rows[0]['currency_unit']='CNY'
            if mutation=='nan': rows[0]['revenue']=float('nan')
            with self.assertRaises(ValueError): validate_dataset(rows,companies)

if __name__=='__main__': unittest.main()
