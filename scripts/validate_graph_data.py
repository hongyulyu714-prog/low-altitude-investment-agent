"""Validate the public, source-backed knowledge-graph delivery for Issue #2."""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
GRAPH_DIR = ROOT / "data" / "graph"
STATUSES = {"verified", "pending_verification"}
STOCK_CODE = re.compile(r"^\d{6}\.(SZ|SH|BJ)$")

NODE_HEADERS = [
    "node_id", "node_name", "node_type", "aliases", "description",
    "source_title", "source_url", "verification_status",
]
RELATION_HEADERS = [
    "relation_id", "from_node_id", "relation_type", "to_node_id",
    "effect_direction", "condition", "source_title", "source_url",
    "verification_status",
]
COMPANY_HEADERS = [
    "company_id", "stock_code", "company_name", "product", "product_node_id",
    "chain_role", "exposure_score", "exposure_basis", "source_title",
    "source_url", "source_location", "verification_status",
]

REQUIRED_NODE_NAMES = {
    "碳纤维", "复合材料", "铝合金", "钛合金", "航空结构胶", "动力电池",
    "电池管理系统 BMS", "电池包", "电机", "电控", "氢燃料电池", "芯片",
    "传感器", "激光雷达/毫米波雷达", "光学相机", "飞控", "导航定位", "通信模块",
    "消费级无人机", "工业无人机", "固定翼无人机", "eVTOL", "通航飞机", "起降场",
    "充换电", "低空通信网络", "低空监视雷达", "低空交通管理平台", "气象服务",
    "低空数字孪生/智联网", "低空物流", "农林植保", "电力巡检", "应急救援", "文旅观光",
}
REQUIRED_RULE_TYPES = {"原材料价格上涨", "政策补贴", "适航进展", "空域开放", "订单合作", "运营场景落地"}


def _load_csv(name: str) -> list[dict[str, str]]:
    with (GRAPH_DIR / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load() -> tuple[list[dict[str, str]], list[dict[str, str]], list[dict[str, str]], list[dict[str, Any]]]:
    """Load the four graph artefacts without mutating their records."""
    with (GRAPH_DIR / "event_rules.json").open(encoding="utf-8") as handle:
        rules = json.load(handle)
    return _load_csv("nodes.csv"), _load_csv("relations.csv"), _load_csv("company_mapping.csv"), rules


def _require_headers(rows: list[dict[str, str]], expected: list[str], artifact: str, errors: list[str]) -> None:
    actual = list(rows[0]) if rows else []
    if actual != expected:
        errors.append(f"{artifact}: unexpected headers")


def _check_records(rows: list[dict[str, str]], id_key: str, artifact: str, errors: list[str]) -> None:
    ids = [row.get(id_key, "") for row in rows]
    if any(not value for value in ids):
        errors.append(f"{artifact}: missing {id_key}")
    if len(ids) != len(set(ids)):
        errors.append(f"{artifact}: duplicate IDs")
    for row in rows:
        if not row.get("source_title") or not row.get("source_url", "").startswith(("http://", "https://")):
            errors.append(f"{artifact}: every record needs a source title and URL")
            break
        if row.get("verification_status") not in STATUSES:
            errors.append(f"{artifact}: invalid verification status")
            break


def validate(
    nodes: list[dict[str, str]],
    relations: list[dict[str, str]],
    companies: list[dict[str, str]],
    rules: list[dict[str, Any]],
) -> list[str]:
    """Return all deterministic contract and acceptance-check violations."""
    errors: list[str] = []
    _require_headers(nodes, NODE_HEADERS, "nodes", errors)
    _require_headers(relations, RELATION_HEADERS, "relations", errors)
    _require_headers(companies, COMPANY_HEADERS, "company mappings", errors)
    _check_records(nodes, "node_id", "nodes", errors)
    _check_records(relations, "relation_id", "relations", errors)
    _check_records(companies, "company_id", "company mappings", errors)

    if len(nodes) != 35:
        errors.append("nodes: requires exactly 35 records")
    names = {row.get("node_name") for row in nodes}
    missing_names = REQUIRED_NODE_NAMES - names
    if missing_names:
        errors.append(f"nodes: missing required names: {sorted(missing_names)}")
    node_ids = {row.get("node_id") for row in nodes}

    if len(relations) != 50:
        errors.append("relations: requires exactly 50 records")
    for relation in relations:
        if relation.get("from_node_id") not in node_ids or relation.get("to_node_id") not in node_ids:
            errors.append("relations: contains dangling node reference")
            break
        if relation.get("from_node_id") == relation.get("to_node_id"):
            errors.append("relations: self-loop is not a directional chain edge")
            break
        if not relation.get("condition"):
            errors.append("relations: every relation needs a condition")
            break
    relation_ids = {row.get("relation_id") for row in relations}
    relation_by_id = {row["relation_id"]: row for row in relations if row.get("relation_id")}

    if not 20 <= len(companies) <= 30:
        errors.append("company mappings: requires 20–30 records")
    roles = Counter(row.get("chain_role") for row in companies)
    required_roles = {"材料/动力", "电子/控制", "无人机/eVTOL整机", "低空基础设施", "运营应用"}
    if set(roles) != required_roles or any(roles[role] != 5 for role in required_roles):
        errors.append("company mappings: requires five records in each of five required groups")
    for company in companies:
        if not STOCK_CODE.fullmatch(company.get("stock_code", "")):
            errors.append("company mappings: invalid stock code")
            break
        if company.get("product_node_id") not in node_ids:
            errors.append("company mappings: contains dangling product node")
            break
        try:
            exposure = float(company.get("exposure_score", ""))
        except ValueError:
            exposure = -1
        if not 0 <= exposure <= 100 or not company.get("exposure_basis"):
            errors.append("company mappings: exposure must be 0–100 with a basis")
            break

    if not isinstance(rules, list) or len(rules) != 10:
        errors.append("event rules: requires exactly 10 rules")
        return errors
    rule_ids = [rule.get("rule_id") for rule in rules]
    if len(rule_ids) != len(set(rule_ids)) or any(not str(value).startswith("RULE_") for value in rule_ids):
        errors.append("event rules: duplicate or malformed rule IDs")
    types = {rule.get("event_type") for rule in rules}
    missing_types = REQUIRED_RULE_TYPES - types
    if missing_types:
        errors.append(f"event rules: missing mandatory event types: {sorted(missing_types)}")
    for rule in rules:
        if rule.get("trigger_node_id") not in node_ids:
            errors.append("event rules: contains dangling trigger node")
            break
        path = rule.get("path")
        edge_ids = rule.get("relation_ids")
        if not isinstance(path, list) or not isinstance(edge_ids, list) or len(path) < 2 or len(edge_ids) != len(path) - 1:
            errors.append("event rules: path/relation count mismatch")
            break
        if path[0] != rule.get("trigger_node_id") or any(node_id not in node_ids for node_id in path):
            errors.append("event rules: invalid path node")
            break
        if any(edge_id not in relation_ids for edge_id in edge_ids):
            errors.append("event rules: invalid relation reference")
            break
        if any(
            relation_by_id[edge_id]["from_node_id"] != path[index]
            or relation_by_id[edge_id]["to_node_id"] != path[index + 1]
            for index, edge_id in enumerate(edge_ids)
        ):
            errors.append("event rules: relation does not connect its stated path")
            break
        if rule.get("verification_status") not in STATUSES or not str(rule.get("source_url", "")).startswith(("http://", "https://")):
            errors.append("event rules: source and verification status required")
            break
    return errors


def main() -> int:
    errors = validate(*load())
    if errors:
        print("Graph data validation failed:", *[f"- {error}" for error in errors], sep="\n")
        return 1
    print("Graph data validation passed: 35 nodes, 50 relations, 25 company mappings, 10 event rules.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
