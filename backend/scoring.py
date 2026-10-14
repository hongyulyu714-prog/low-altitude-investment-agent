"""Deterministic, conservative impact scoring. No Wind connection required."""
from __future__ import annotations

import argparse
import csv
import json
import math
from datetime import date
from pathlib import Path

FORMULA_VERSION = 'impact-v1.0.0'
ROLES = ('materials_power', 'electronics_control', 'aircraft', 'infrastructure', 'operations')
# Illustrative scenario assumptions, NOT estimated causal effects.
EVENTS = {
    'EVT_POLICY_SUPPORT': {'name': '低空政策支持', 'sensitivity': (55, 60, 85, 90, 80), 'direction': ('positive',)*5},
    'EVT_INPUT_PRICE_UP': {'name': '关键原材料涨价', 'sensitivity': (80, 35, 90, 20, 30), 'direction': ('uncertain', 'negative', 'negative', 'negative', 'negative')},
    'EVT_AIRWORTHINESS': {'name': '适航认证进展', 'sensitivity': (35, 50, 95, 45, 85), 'direction': ('positive',)*5},
}
ANNUAL_FIELDS = ('revenue','revenue_yoy','net_profit','gross_margin','operating_cash_flow','rd_expense','inventory','accounts_receivable','capex','asset_liability_ratio')
QUARTER_FIELDS = ('revenue','net_profit','gross_margin','operating_cash_flow')
MARKET_FIELDS = ('market_cap','pe_ttm','pb','ps_ttm','total_return_1y','volatility_1y')

def number(value):
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError('Expected a finite number or null')
    return float(value)

def bounded(value):
    value = number(value)
    if value is not None and not 0 <= value <= 100:
        raise ValueError('Score must be in [0, 100]')
    return value

def calculate_impact_score(exposure, sensitivity, financial_materiality):
    factors = [bounded(v) for v in (exposure, sensitivity, financial_materiality)]
    if None in factors:
        return None
    return round(math.prod(factors) / 10000, 2)

def financial_materiality(financial):
    """Financial amplification proxy, not financial health or predicted profit."""
    values = {f: number(financial.get(f)) for f in ('revenue','gross_margin','operating_cash_flow','asset_liability_ratio')}
    missing = [f for f,v in values.items() if v is None]
    if missing:
        return None, {}, ['missing_financial:' + ','.join(missing)]
    if values['revenue'] <= 0:
        return None, {}, ['nonpositive_revenue']
    clip = lambda x: min(100., max(0., x))
    components = {
        'margin_pressure': clip(100 - 2 * values['gross_margin']),
        'cashflow_pressure': clip(50 - 250 * values['operating_cash_flow'] / values['revenue']),
        'leverage': clip(values['asset_liability_ratio']),
    }
    score = .4*components['margin_pressure'] + .35*components['cashflow_pressure'] + .25*components['leverage']
    flags = []
    if values['gross_margin'] < 0: flags.append('negative_gross_margin')
    if values['operating_cash_flow'] < 0: flags.append('negative_operating_cash_flow')
    if not 0 <= values['asset_liability_ratio'] <= 100: flags.append('abnormal_leverage_clipped')
    return round(score, 6), components, flags

def score_company(company, financial, event_id, *, allow_mock=False):
    if event_id not in EVENTS:
        raise ValueError('Unsupported event_id')
    if company['stock_code'] != financial['stock_code']:
        raise ValueError('Company/financial code mismatch')
    event = EVENTS[event_id]
    status = company.get('verification_status')
    fstatus = financial.get('verification_status')
    is_mock = status == 'mock' or fstatus == 'mock'
    flags = list(financial.get('risk_flags', []))
    missing = []
    if is_mock and not allow_mock:
        raise ValueError('Mock inputs require explicit allow_mock=True')
    exposure = bounded(company.get('exposure_score'))
    if status not in ('verified','mock') or not company.get('source_url'):
        exposure = None
        missing.append('exposure_mapping_unverified')
    # Default event rules are assumptions; real scores require an approved override.
    override = company.get('event_rules', {}).get(event_id)
    sensitivity = None
    direction = 'uncertain'
    if override and override.get('verification_status') == 'verified' and override.get('source_url'):
        sensitivity = bounded(override.get('sensitivity'))
        direction = override.get('impact_direction', 'uncertain')
    elif allow_mock and status == 'mock' and company.get('chain_role') in ROLES:
        i = ROLES.index(company['chain_role'])
        sensitivity, direction = event['sensitivity'][i], event['direction'][i]
    else:
        missing.append('event_rule_unverified')
    if direction not in ('positive','negative','neutral','uncertain'):
        raise ValueError('Invalid impact direction')
    materiality, components, financial_flags = financial_materiality(financial)
    flags += financial_flags
    if fstatus not in ('verified','mock') or not financial.get('source_url'):
        materiality = None
        missing.append('financial_source_unverified')
    if materiality is None: missing.append('financial_materiality_unavailable')
    impact = calculate_impact_score(exposure, sensitivity, materiality)
    if impact is None: missing.append('insufficient_inputs')
    return dict(stock_code=company['stock_code'], company_name=company['company_name'],
                event_id=event_id, exposure=exposure, sensitivity=sensitivity,
                financial_materiality=materiality, impact_score=impact,
                formula_version=FORMULA_VERSION, risk_flags=sorted(set(flags + (['mock_data'] if is_mock else []))),
                impact_direction=direction, verification_status='mock' if is_mock else ('verified' if impact is not None else 'pending_verification'),
                missing_reason=sorted(set(missing)), components=components,
                source_urls=[v for v in (company.get('source_url'), financial.get('source_url'), (override or {}).get('source_url')) if v],
                report_period=financial.get('report_period'), as_of_date=financial.get('as_of_date'))

def rank_scores(scores):
    """Unknown scores remain visible, unranked; ties are stable by stock code."""
    result = sorted(scores, key=lambda r: (r['impact_score'] is None, -(r['impact_score'] or 0), r['stock_code']))
    return [dict(r, rank=i+1 if r['impact_score'] is not None else None) for i,r in enumerate(result)]

def to_financial_score(result):
    """Explicit adapter for existing contracts; unknowns cannot become zero."""
    if result['impact_score'] is None:
        raise ValueError('Insufficient data; do not export an unknown score to legacy contract')
    keys = ('stock_code','event_id','exposure','sensitivity','financial_materiality','impact_score','formula_version','risk_flags','impact_direction')
    return {k: result[k] for k in keys}

def load_financials(path):
    records=[]
    with open(path, encoding='utf-8-sig', newline='') as f:
        for raw in csv.DictReader(f):
            r = dict(raw)
            for field in ANNUAL_FIELDS + MARKET_FIELDS:
                if field in r:
                    r[field] = None if r[field] in ('', 'null') else number(float(r[field]))
            records.append(r)
    return records

def validate_dataset(records, companies):
    codes = [c['stock_code'] for c in companies]
    if len(codes) != len(set(codes)): raise ValueError('Duplicate company code')
    if set(codes) != {r['stock_code'] for r in records}: raise ValueError('Company coverage mismatch')
    seen=set(); dates=set()
    expected = {'annual': {'2023-12-31','2024-12-31','2025-12-31'}, 'quarter': {'2024-09-30','2024-12-31','2025-03-31','2025-06-30','2025-09-30','2025-12-31','2026-03-31','2026-06-30'}}
    for r in records:
        kind=r['period_type']
        if kind not in ('annual','quarter','market'): raise ValueError('Unknown period_type')
        period=r['as_of_date'] if kind=='market' else r['report_period']
        date.fromisoformat(period)
        key=(r['stock_code'],kind,period)
        if key in seen: raise ValueError('Duplicate financial record')
        seen.add(key)
        if r['currency_unit']!='CNY_million': raise ValueError('Wrong currency unit')
        fields = {'annual':ANNUAL_FIELDS,'quarter':QUARTER_FIELDS,'market':MARKET_FIELDS}[kind]
        for field in fields:
            value=number(r.get(field))
            if value is None and not r.get('missing_reason'): raise ValueError('Missing value needs missing_reason')
        if kind=='market': dates.add(period)
    if len(dates)!=1: raise ValueError('Market dates must match')
    for code in codes:
        for kind, periods in expected.items():
            if {p for c,k,p in seen if c==code and k==kind} != periods: raise ValueError('Incomplete financial periods')
        if sum(c==code and k=='market' for c,k,p in seen)!=1: raise ValueError('Expected one market row')

def run(financial_path, company_path, *, allow_mock=False):
    records=load_financials(financial_path)
    companies=json.loads(Path(company_path).read_text(encoding='utf-8'))
    validate_dataset(records, companies)
    latest={r['stock_code']:r for r in records if r['period_type']=='annual' and r['report_period']=='2025-12-31'}
    as_of=next(r['as_of_date'] for r in records if r['period_type']=='market')
    return {event:rank_scores([score_company(c,dict(latest[c['stock_code']],as_of_date=as_of),event,allow_mock=allow_mock) for c in companies]) for event in EVENTS}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--financials',type=Path,default=Path('data/financials.example.csv'))
    parser.add_argument('--companies',type=Path,default=Path('data/scoring_companies.example.json'))
    parser.add_argument('--allow-mock',action='store_true')
    parser.add_argument('--output',type=Path,default=Path('data/private/company_impact.json'))
    args=parser.parse_args()
    output=run(args.financials,args.companies,allow_mock=args.allow_mock)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(output,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')

if __name__=='__main__': main()
