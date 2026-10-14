"""Validate the issue #4 corpus offline using only the Python standard library."""
import argparse
import csv
import json
import re
import random
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
QUOTAS = {'policy': 8, 'corporate': 8, 'certification': 4, 'material': 4, 'application': 6}
CASE_FIELDS = {'case_id', 'question', 'event_id', 'expected_path', 'expected_company_types',
               'required_evidence_ids', 'expected_direction', 'answer_points', 'conditions',
               'not_supported', 'path_status'}


def read_csv(path):
    with path.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        return reader.fieldnames, list(reader)


def load(root=ROOT):
    event_header, events = read_csv(root / 'data/events.csv')
    evidence_header, evidence = read_csv(root / 'data/evidence.csv')
    _, nodes = read_csv(root / 'data/evidence_nodes.csv')
    cases = json.loads((root / 'tests/test_cases.json').read_text(encoding='utf-8'))
    review = json.loads((root / 'data/evidence_review.json').read_text(encoding='utf-8'))
    for header, name in [(event_header, 'events'), (evidence_header, 'evidence')]:
        template = (root / f'data/templates/{name}.template.csv').read_text(encoding='utf-8').strip().split(',')
        if header != template:
            raise ValueError(f'{name}: header differs from repository template')
    return events, evidence, nodes, cases, review


def validate(events, evidence, nodes, cases, review):
    errors = []
    # Dates in the review manifest are editable corpus data, so they cannot
    # establish their own trusted upper bound. Use the validator's clock.
    trusted_cutoff = date.today()

    def check(ok, message):
        if not ok:
            errors.append(message)

    def unique(rows, field, prefix):
        ids = [r.get(field, '') for r in rows]
        check(len(ids) == len(set(ids)), f'{field}: duplicate IDs')
        check(all(re.fullmatch(prefix + r'[A-Z0-9_]+', i) for i in ids), f'{field}: invalid ID')
        return {r.get(field): r for r in rows}

    def valid_date(value):
        try:
            return bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', value)) and date.fromisoformat(value) <= trusted_cutoff
        except (ValueError, TypeError):
            return False

    def valid_url(value):
        parsed = urlparse(value)
        return parsed.scheme == 'https' and bool(parsed.netloc) and not parsed.username and not parsed.password

    event_map = unique(events, 'event_id', 'EVT_')
    evidence_map = unique(evidence, 'evidence_id', 'EVD_')
    node_map = unique(nodes, 'node_id', 'NODE_')
    unique(cases, 'case_id', 'CASE_')
    check(len(events) >= 30 and len(evidence) >= 30 and len(cases) >= 30, 'minimum corpus size is 30')
    check(valid_date(review.get('generated_at', '')), 'invalid generated_at')
    counts = Counter(e.get('event_type') for e in events)
    for kind, quota in QUOTAS.items():
        check(counts[kind] >= quota, f'{kind}: requires {quota} events')
    check(set(counts) <= set(QUOTAS), 'unknown event_type')
    check({e['event_type'] for e in events[:10]} == set(QUOTAS), 'first ten must cover all five categories')
    for collection in [events, evidence, nodes]:
        check(all(all(isinstance(v, str) and v.strip() for v in row.values()) for row in collection), 'CSV contains empty or malformed fields')
    for event in events:
        key = event['event_id']
        check(valid_date(event['event_date']), f'{key}: invalid event_date')
        check(valid_url(event['source_url']), f'{key}: invalid source_url')
        check(event['direction'] in {'positive', 'negative', 'uncertain'}, f'{key}: invalid direction')
        check(event['source_level'] in {'A', 'B', 'C', 'D'}, f'{key}: invalid source_level')
        check(event['verification_status'] in {'verified', 'pending_verification'}, f'{key}: invalid verification_status')
        affected = event['affected_node_ids'].split(';')
        check(all(n in node_map for n in affected) and len(set(affected)) == len(affected), f'{key}: unknown or repeated affected node')
        linked = [e for e in evidence if e['event_id'] == key]
        check(bool(linked), f'{key}: no evidence')
        if event['verification_status'] == 'verified':
            check(event['source_level'] in {'A', 'B'}, f'{key}: verified event needs primary A/B source')
            check(any(e['credibility_level'] in {'A', 'B'} and e['source_url'] == event['source_url'] for e in linked), f'{key}: no matching primary evidence')
    for item in evidence:
        key = item['evidence_id']
        check(item['event_id'] in event_map, f'{key}: dangling event reference')
        check(valid_date(item['published_date']), f'{key}: invalid published_date')
        check(valid_url(item['source_url']), f'{key}: invalid source_url')
        check(item['credibility_level'] in {'A', 'B', 'C', 'D'}, f'{key}: invalid credibility level')
        check(0 < len(item['quote']) <= 180, f'{key}: quote must be a short excerpt')
        if item['event_id'] in event_map:
            check(item['credibility_level'] == event_map[item['event_id']]['source_level'], f'{key}: event/evidence source level mismatch')
    for case in cases:
        key = case['case_id']
        check(CASE_FIELDS <= case.keys(), f'{key}: missing fields')
        event = event_map.get(case.get('event_id'))
        check(event is not None, f'{key}: unknown event')
        for field in ['expected_path', 'expected_company_types', 'required_evidence_ids', 'answer_points', 'conditions', 'not_supported']:
            value = case.get(field)
            check(isinstance(value, list) and bool(value) and all(isinstance(v, str) and v.strip() for v in value), f'{key}: invalid {field}')
        path = case.get('expected_path', [])
        check(len(path) >= 2 and all(n in node_map for n in path), f'{key}: unknown/short expected path')
        check(case.get('path_status') == 'hypothesis_pending_graph_validation', f'{key}: unvalidated graph path must remain a hypothesis')
        required = case.get('required_evidence_ids', [])
        check(len(set(required)) == len(required) and all(i in evidence_map for i in required), f'{key}: unknown/repeated evidence ID')
        check(any(evidence_map[i]['event_id'] == case.get('event_id') for i in required if i in evidence_map), f'{key}: no evidence for own event')
        if event:
            check(case.get('expected_direction') == event['direction'], f'{key}: direction mismatch')
            check(bool(path) and path[0] in event['affected_node_ids'].split(';'), f'{key}: path not linked to event')
            check(all(n in event['affected_node_ids'].split(';') for n in path), f'{key}: path contains an unrelated node')
    check({c.get('event_id') for c in cases} == set(event_map), 'cases do not cover every event')
    reviews = review.get('records', [])
    check(review.get('first_batch_event_ids') == [e['event_id'] for e in events[:10]], 'first batch review IDs mismatch')
    seed = review.get('sample_seed')
    check(isinstance(seed, int), 'invalid sample seed')
    if isinstance(seed, int) and len(events) >= 10:
        check(review.get('sampled_event_ids') == sorted(random.Random(seed).sample([e['event_id'] for e in events], 10)), 'random sample is not reproducible')
    check(len(reviews) == len(events) and {r.get('event_id') for r in reviews} == set(event_map), 'review coverage mismatch')
    for row in reviews:
        event = event_map.get(row.get('event_id'))
        check(valid_date(row.get('reviewed_at', '')) and bool(row.get('event_date_basis')), 'review lacks date/basis')
        check(row.get('human_review_status') in {'pending', 'approved', 'rejected'}, 'invalid human review status')
        if event:
            check(row.get('source_url') == event['source_url'], 'review URL mismatch')
            check(row.get('verification_status') == event['verification_status'], 'review status mismatch')
            expected_ids = {e['evidence_id'] for e in evidence if e['event_id'] == event['event_id']}
            check(set(row.get('evidence_ids', [])) == expected_ids, 'review evidence IDs mismatch')
    for event in events[:10]:
        check(event['verification_status'] == 'verified' and event['source_level'] in {'A', 'B'}, 'first ten require verified A/B facts')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        data = load(args.root)
        errors = validate(*data)
    except (ValueError, KeyError, OSError, TypeError) as exc:
        raise SystemExit(f'Invalid corpus: {exc}') from exc
    if errors:
        raise SystemExit('\n'.join(errors))
    print(json.dumps({'events': len(data[0]), 'evidence': len(data[1]), 'cases': len(data[3]),
                      'categories': dict(Counter(e['event_type'] for e in data[0])),
                      'graph_alignment': 'pending', 'human_review': 'pending', 'result': 'PASS'}, ensure_ascii=False))


if __name__ == '__main__':
    main()
