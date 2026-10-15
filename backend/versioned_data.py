"""Pinned public inputs plus explicitly synthetic scoring; no mock fallback."""
from __future__ import annotations

import csv
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path

from contracts import Event, Evidence, GraphPath, Report
from contracts.models import CompanyImpact, Conclusion
from .scoring import FORMULA_VERSION, run as score_dataset

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = {
    'data/events.csv', 'data/evidence.csv', 'data/evidence_review.json',
    'data/graph/nodes.csv', 'data/graph/relations.csv', 'data/graph/event_rules.json',
    'data/graph/company_mapping.csv', 'data/financials.example.csv',
    'data/scoring_companies.example.json',
}


def load_inputs(directory: Path, version: str):
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    if manifest['data_version'] != version:
        raise ValueError('数据清单版本不一致')
    if set(manifest['files']) != REQUIRED_FILES:
        raise ValueError('数据清单输入集合不完整或不受支持')
    inputs = {}
    for name, digest in manifest['files'].items():
        raw = (ROOT / name).read_bytes()
        if hashlib.sha256(raw).hexdigest() != digest:
            raise ValueError(f'版本化输入校验失败：{name}；请复核并发布新版本')
        text = raw.decode('utf-8-sig')
        inputs[name] = json.loads(text) if name.endswith('.json') else list(csv.DictReader(io.StringIO(text)))
    return manifest, inputs


def unique(rows, key):
    result = {row[key]: row for row in rows}
    if len(result) != len(rows):
        raise ValueError(f'重复标识：{key}')
    return result


def selected_event(manifest, inputs):
    row = unique(inputs['data/events.csv'], 'event_id')[manifest['event_id']]
    aliases = manifest['event_node_aliases']
    return Event(**{k: row[k] for k in ('event_id', 'event_name', 'event_type', 'event_date',
                                       'direction', 'source_title', 'source_url', 'verification_status')},
                 affected_node_ids=list(dict.fromkeys(aliases[n] for n in row['affected_node_ids'].split(';'))))


def build_report(directory: Path, run_id: str, event_id: str, version: str) -> Report:
    manifest, inputs = load_inputs(directory, version)
    if event_id != manifest['event_id']:
        raise ValueError(f'找不到事件 {event_id}；版本 {version} 仅包含 {manifest["event_id"]}')
    event = selected_event(manifest, inputs)
    nodes = unique(inputs['data/graph/nodes.csv'], 'node_id')
    relations = unique(inputs['data/graph/relations.csv'], 'relation_id')
    rules = unique(inputs['data/graph/event_rules.json'], 'rule_id')
    rule = rules[manifest['rule_id']]
    if rule['trigger_node_id'] not in event.affected_node_ids:
        raise ValueError('事件与规则触发节点不一致')
    if len(rule['path']) != len(rule['relation_ids']) + 1:
        raise ValueError('规则关系数量不一致')
    for i, rid in enumerate(rule['relation_ids']):
        relation = relations[rid]
        if (relation['from_node_id'], relation['to_node_id']) != tuple(rule['path'][i:i+2]):
            raise ValueError(f'关系端点不一致：{rid}')
    evidence = []
    review = unique(inputs['data/evidence_review.json']['records'], 'event_id')[event_id]
    for row in inputs['data/evidence.csv']:
        if row['event_id'] == event_id:
            if row['evidence_id'] not in review['evidence_ids']:
                raise ValueError('证据缺少核验记录')
            evidence.append(Evidence(**{k: row[k] for k in ('evidence_id', 'event_id', 'source_title',
                'published_date', 'source_url', 'quote', 'credibility_level')},
                verification_status=review['verification_status']))
    if not evidence:
        raise ValueError('事件证据为空')
    event_evidence_ids = [e.evidence_id for e in evidence]
    # These excerpts describe the repository's mapping/rule, not verbatim publisher quotations.
    rule_evidence_id = 'EVD_PROTOTYPE_AIRWORTHINESS_RULE'
    evidence.append(Evidence(evidence_id=rule_evidence_id, event_id=event_id,
        source_title=rule['source_title'], source_url=rule['source_url'],
        quote='仓库条件规则（待核验）：' + rule['exception'], credibility_level='B',
        verification_status='pending_verification'))
    path = GraphPath(path_id='PATH_PROTOTYPE_AIRWORTHINESS', event_id=event_id,
        node_ids=rule['path'], relation_ids=rule['relation_ids'], rule_id=rule['rule_id'],
        node_names={n: nodes[n]['node_name'] for n in rule['path']}, rule_text=rule['exception'],
        impact_direction=rule['impact_direction'], evidence_ids=event_evidence_ids + [rule_evidence_id],
        verification_status='pending_verification')
    # Issue #3 already owns these scenario numbers and formulas. Never infer a score from graph exposure.
    scenarios = {s['stock_code']: s for s in score_dataset(ROOT / 'data/financials.example.csv',
        ROOT / 'data/scoring_companies.example.json', allow_mock=True)[manifest['scoring_event_id']]}
    mappings = inputs['data/graph/company_mapping.csv']
    unique(mappings, 'company_id')
    candidates = [m for m in mappings if m['product_node_id'] in rule['path']]
    companies = []
    for mapping in candidates:
        code = mapping['stock_code']
        score = scenarios.get(code)
        mapping_id = 'EVD_PROTOTYPE_MAPPING_' + code.replace('.', '_')
        evidence.append(Evidence(evidence_id=mapping_id, event_id=event_id,
            source_title=mapping['source_title'], source_url=mapping['source_url'],
            quote='仓库产品映射（不证明财务受益）：' + mapping['product'] + '；' + mapping['exposure_basis'],
            stock_codes=[code], credibility_level='B', verification_status=mapping['verification_status']))
        ids = [mapping_id, rule_evidence_id]
        if score:
            score_id = 'EVD_PROTOTYPE_SCORE_' + code.replace('.', '_')
            evidence.append(Evidence(evidence_id=score_id, event_id=event_id,
                source_title='Issue #3 合成财务与情景评分样例（非公司实际财务）',
                source_url='https://example.invalid/synthetic-wind-v1', quote=manifest['score_basis'],
                stock_codes=[code], credibility_level='mock', verification_status='mock'))
            ids.append(score_id)
        companies.append(CompanyImpact(stock_code=code, company_id=mapping['company_id'],
            company_name=mapping['company_name'], chain_role=mapping['chain_role'],
            node_ids=[mapping['product_node_id']], impact_direction=score['impact_direction'] if score else 'uncertain',
            impact_score=score['impact_score'] if score else None,
            exposure=score['exposure'] if score else None, sensitivity=score['sensitivity'] if score else None,
            financial_materiality=score['financial_materiality'] if score else None,
            formula_version=FORMULA_VERSION, score_basis=manifest['score_basis'],
            risk_flags=(score['risk_flags'] if score else ['financial_inputs_unavailable']) +
                ['pending_verification', 'scenario_not_forecast'], evidence_ids=ids,
            verification_status='pending_verification'))
    companies.sort(key=lambda c: (c.impact_score is None, -(c.impact_score or 0), c.stock_code))
    conclusions = [Conclusion(conclusion_id='CONC_PROTOTYPE_EVENT',
        text='历史公告披露 EH216-S 获得型号合格证；型号审定进展不等于商业运营许可。',
        evidence_ids=event_evidence_ids, verification_status=event.verification_status),
        Conclusion(conclusion_id='CONC_PROTOTYPE_PATH',
        text='候选公司由产品节点映射筛选；向起降场和物流的传导取决于运营、场地和空域条件，仍待核验。评分使用合成财务和情景假设，缺输入保留空分，不代表真实公司受益。',
        evidence_ids=[e.evidence_id for e in evidence], verification_status='pending_verification')]
    available = {e.evidence_id for e in evidence}
    if len(available) != len(evidence):
        raise ValueError('证据 ID 重复')
    for item in [path, *companies, *conclusions]:
        if not set(item.evidence_ids) <= available:
            raise ValueError('报告存在悬空证据引用')
    return Report(report_id='RPT_' + run_id.removeprefix('RUN_'), run_id=run_id,
        data_version=version, event=event, paths=[path], companies=companies, evidence=evidence,
        conclusions=conclusions, verification_status='pending_verification', generated_at=datetime.now(timezone.utc))
