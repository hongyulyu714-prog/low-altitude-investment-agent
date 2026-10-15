# 版本化黄金链路 V1（Issue #14）

`prototype-v1` 选择仓库已有的历史事件 `EVT_002`：亿航宣布 EH216-S 获得型号合格证（公告日期 2023-10-13）。报告通过 API 生成，不读取 `data/mock` 补全该版本。

## 启动与重现

Python 3.11+、Node 22.12+（CI 使用 Node 24）。从仓库根目录运行：

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt httpx
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

另一个终端进入前端：

```bash
cd frontend
npm ci
npm run dev
```

打开 http://127.0.0.1:5173，保留“后端 API”，将“数据版本”选为 `prototype-v1`，选择历史公告后点击“查看分析”。Vite 将 `/api` 请求转发到本地后端，无需配置跨域。其他后端地址可通过 `SKY_BACKEND_URL` 指定。

```bash
curl 'http://127.0.0.1:8000/api/v1/events?data_version=prototype-v1'
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H 'Content-Type: application/json' \
  -d '{"event_id":"EVT_002","data_version":"prototype-v1"}'
```

结果包含 `NODE_EVTOL → NODE_VERTIPORT → NODE_LOW_ALTITUDE_LOGISTICS`，三家候选公司、两条结论和可解析的证据引用。顺丰、苏交科的合成情景分为 17.15、10.39；威海广泰缺少对应合成财务输入，返回 `null`、不参与排名。数字只是既有 Issue #3 样例计算的回归基准。

## 数据清单与边界

受控入口为 `data/versions/prototype-v1/manifest.json`。清单固定事件、规则、证据节点到图谱节点的显式别名、评分情景，以及每份输入的 SHA-256。任何输入内容变化均导致加载失败；复核后应发布新版本，不能静默改写同一版本。未知版本、该版本未包含的事件均返回 HTTP 422，不回退到 mock。

| 层 | 输入 | 输出语义 |
| --- | --- | --- |
| 历史事件和证据 | `data/events.csv`、`evidence.csv`、`evidence_review.json` | 继承既有核验记录，范围仅限历史公告；不宣称已重新在线核验或人工复核完成 |
| 路径 | `data/graph/nodes.csv`、`relations.csv`、`event_rules.json` | 校验实际边端点和规则路径；规则正文为条件/例外，传导始终标 `pending_verification` |
| 候选公司 | `data/graph/company_mapping.csv` | 仅通过 `product_node_id` 与当前路径匹配；产品相关不证明供应关系或利润受益 |
| 数值计算 | `data/financials.example.csv`、`scoring_companies.example.json` | 复用 `backend.scoring` 已有 `EVT_AIRWORTHINESS` 合成情景，显式 `allow_mock=True`，公式 `impact-v1.0.0` |
| 报告 | `backend/versioned_data.py` | 所有路径、公司、结论证据 ID 都在返回的 `evidence` 集合（内部 selected evidence）内 |

合成评分的暴露度来自 Issue #3 样例，不使用图谱中的产品匹配度代替业务收入暴露；敏感度是该模块已有情景假设，不是本任务新增估计。合成数据证据保留 `mock` 状态和 `example.invalid` 地址，无可用原文。映射与规则摘录明确写“仓库映射/规则”，不是伪造的出版物原句。

`mock-v1` 继续作为独立的接口演示数据源；“文件 Mock”始终只支持该版本。`prototype-v1` 是公开历史资料加合成样例的混合演示，报告和公司结论保持待核验。未提交或连接 Wind 原始导出，未新增真实公司财务或未经批准的数值规则。

## 待补充的数据输入

1. 图谱负责人核验适航进展向起降场、物流的传导条件及候选公司映射。
2. 财务负责人提供允许使用的真实财务输入和已批准的事件敏感度、业务暴露度；当前两家样例分不能升级为真实评分。
3. 威海广泰缺少配套样例/真实财务，保留空分直到数据交付。

## 3 分钟演示

- 0:00–0:40：在 API 模式选择 `prototype-v1` 和历史公告；点击查看分析，确认版本、运行 ID 和三家公司。
- 0:40–1:20：查看适航 → 起降场 → 物流路径，点击起降场节点，检查苏交科和威海广泰两行高亮。打开规则与证据，说明运营、场地和空域条件仍待核验。
- 1:20–2:10：进入公告证据，查看日期、短摘录、可信度、核验状态和可点击原始来源；按来源链接打开原公告。已核验历史事实不等于已核验财务受益。
- 2:10–2:40：查看顺丰评分分项与公式版本，说明合成输入；对比威海广泰的“数据不足”，缺失不补零。
- 2:40–3:00：切回 `mock-v1`，确认结果与选择清空；无效版本的 curl 请求返回 422，说明版本不会自动回退。

## 检查与截图

```bash
python -m unittest discover -s tests -v
python scripts/validate_evidence.py
python scripts/validate_graph_data.py
cd frontend
npm run check:names
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

集成测试 `tests/test_golden_chain.py` 覆盖请求、数据清单、跨模块组合、评分复算、空分、证据闭合、版本拒绝和运行记录。浏览器测试 `frontend/e2e/golden-chain.spec.ts` 直接请求本地 API，覆盖路径、映射、证据链接、分项与换版本旧响应隔离，并生成 [报告截图](issue14/evidence/prototype-report.png) 和 [证据截图](issue14/evidence/prototype-evidence.png)。

本次本地验证：后端 60 项、前端单元 34 项、Chrome 浏览器 22 项全部通过；类型检查、lint、构建、模块名称检查、事件证据与图谱数据校验通过。设计检测器仅报告原有 Roboto 字体和证据摘录边线提示，本任务沿用现有设计基线。远程 CI 以 PR 检查结果为准。
