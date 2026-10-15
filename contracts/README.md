# 报告契约

`models.py` 为 Pydantic 契约与 FastAPI OpenAPI 的来源。

- `GET /api/v1/events?data_version=mock-v1|prototype-v1`：返回版本内事件数组；未支持版本返回 422。
- `POST /api/v1/analyze`：`AnalysisRequest` 显式选择 `event_id`、`data_version`。默认保持 `mock-v1`，新案例使用 `EVT_002` / `prototype-v1`。
- `Report.evidence` 即选入报告的证据集合，所有 `evidence_ids` 必须在该集合内解析。同一报告只包含当前事件证据。
- `GraphPath` 新增可选节点名称字典 `node_names`、规则条件正文 `rule_text` 与核验状态。相邻节点由 `relation_ids` 连接；版本加载器核对 CSV 实际端点。
- `CompanyImpact` 新增明确的 `company_id`、`node_ids`、三个评分分项、`formula_version`、`score_basis`。缺失值为 `null`，`impact_score` 允许空值，不以零代替。旧 mock 不补造缺失分项。
- `pending_verification`、`verified` 与 `mock` 含义独立于可信度等级。混合报告保持待核验，合成评分由风险标记 `mock_data` 与 `score_basis` 明示。

完整来源、计算口径与演示步骤见 [版本化黄金链路](../docs/GOLDEN_CHAIN_V1.md)。
