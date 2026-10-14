# 总控 Agent 架构（Issue #1）

```text
事件 JSON ─┐
图谱路径 ─┼─→ InvestmentOrchestrator ─→ 结构化 Report ─→ 前端/API
公司映射 ─┤            │
财务评分 ─┤            └─→ data/runs/<run_id>.json（本地运行留痕）
证据 JSON ─┘
```

## 边界与接口

- `contracts/models.py` 是跨模块唯一字段定义。模型拒绝未声明字段、检查 ID 与证券代码格式，并限制评分为 `0–100`。
- 证据通过显式 `stock_codes` 关联公司，而不是从引文文本猜测；总控只接受本次事件中、且可解析到公司映射的关联。图谱路径要求每条关系连接相邻节点，因此 `relation_ids` 数量必须等于 `node_ids - 1`。
- `data/mock/` 的五类输入可被对应 Agent 的真实输出原位替换：`events`、`graph_paths`、`companies`、`financial_scores`、`evidence`。总控仅接受显式注册的 `data_version`，并以该版本选择数据目录；未知版本会记录为失败运行而不会返回错误标注来源的报告。
- `POST /api/v1/analyze` 接收 `event_id` 和可选 `data_version`，返回事件、路径、公司影响、证据、结论与 `run_id`；每条结论显式带有 `evidence_ids`，总控会校验其均存在于本次事件的证据集。无证据的结论会标记 `pending_verification`。`GET /health` 便于前端检查服务可用性。

## 可追溯与失败策略

每次运行先记录 `run_id`、输入事件、数据版本和开始时间，再写入完成时间、状态、报告 ID 或可读错误。运行记录是本地运行产物，位于被 Git 忽略的 `data/runs/`。

总控会拒绝：未知事件、空图谱路径、评分找不到公司、路径引用缺失证据、格式错误的公司代码或评分。若公司未能关联证据，输出会保留该公司但标记 `pending_verification`，不会把结论标成已核验。

## 模拟数据声明

当前“动力电池价格下降 15%”全链路是**纯 mock**。所有示例公司、代码、评分、证据 URL 和结论仅验证接口与展示链路，不能作为事实陈述或投资建议。
