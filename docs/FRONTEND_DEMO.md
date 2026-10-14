# SkyNexus Frontend V1 · Issue #5

本版以 A · Graph Exploration + Spatial Exploration 为基础，实现事件选择、真实分析 API、ID 路径研究、公司榜、风险与证据共享抽屉。空间图为独立 TEST 演示，不建立业务节点映射。

## 新克隆后的启动

需要 Node ≥22.12（本次使用24.14.0）、npm、Python ≥3.10。前端保留 React19/Vite7 工程，增加 TypeScript、锁文件和测试脚本。[Vite7 运行时要求](https://v7.vite.dev/guide/migration.html)。

```bash
# 仓库根目录，建立仅供本次 HTTP 演示的环境
python -m venv .venv
source .venv/bin/activate
python -m pip install fastapi 'pydantic>=2,<3' uvicorn httpx
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

另开终端：

```bash
cd frontend
source ../.venv/bin/activate
npm ci
npm run dev
```

打开 http://127.0.0.1:5173 。默认数据源为“后端 API · Mock”；先选择已有事件，再点击“查看分析”。Vite 将 `/api` 和 `/health` 代理到8000，无需改后端 CORS。可通过 `SKY_BACKEND_URL=http://127.0.0.1:8001 npm run dev` 指定其他本地服务。静态部署需要同源反向代理 `/api`、`/health`；本 PR 不部署服务。

后端未启动时页面显示连接失败，提供重试，不静默切换到文件。用户可主动选“文件 Mock”后重新选择、分析；此模式读取仓库五类同版本 JSON，分项完整，但没有服务运行 ID、生成时间或源结论，分别显示数据不足。

## API 联调

```bash
curl http://127.0.0.1:8000/health
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H 'Content-Type: application/json' \
  -d '{"event_id":"EVT_BATTERY_PRICE_DOWN_001","data_version":"mock-v1"}'
```

真实接入已合入的 POST `/api/v1/analyze`。事件列表没有 API，adapter 从 `data/mock/events.json` 获取；不把30条证据库事件直接送入只支持当前 Mock 的接口。报告中的 `run_id`、版本、生成时间在“数据来源 / 运行信息”中可读。没有完整 RunRecord 查询。

## 3 分钟演示

| 时间 | 可操作步骤 | 核对点 |
|---|---|---|
| 0:00–0:30 | 说明模拟边界；默认API，选择“动力电池价格下降15%”，点击查看分析 | 真实 POST；事件方向下降，4路径环节、3分析返回公司、3证据；不称完整候选集 |
| 0:30–1:10 | 拖图谱空白区域、滚轮缩放；选择节点B与正向路径；点击聚焦节点、路径概览、返回 | TEST标记；手动后保持视角；节点/路径选择不接管镜头；显式居中保持缩放；回溯可用 |
| 1:10–1:40 | 点击公司比较，查看业务榜，打开eVTOL公司 | 总分40.80、来源方向、真实风险；API分项不足，不借文件填分 |
| 1:40–2:10 | 打开公司“电池价格输入”证据；点击来源链接；逐层返回 / 返回图谱现场 | 原摘录、日期、mock可信度、Mock核验分别可读；链接为 example.com 示例地址；恢复现场 |
| 2:10–2:35 | 查看下方业务路径ID，点击 NODE_BATTERY、查看规则ID与路径证据 | 规则正文/名称/端点/公司映射不足；不把 TEST 曲线解释为业务规则 |
| 2:35–3:00 | 选择“TEST联动”，选B、主动筛选、打开Alpha→测试记录→返回；或主动切文件Mock展示69/81/73 | TEST公司没有证券代码/评分/真实来源；文件分项有明确来源；不混用两类对象 |

空间历史只保留当前事件内20次视角/选择操作，不是新增历史运行产品。展开图谱隐藏公司表，收起恢复现场；展开期间“公司比较”禁用，需收起后使用。系统 Reduced Motion 和手动减少动态效果保留全部信息，关闭漂移与相机动画；可暂停非必要运动。

## 数据边界与协作依赖

| 能力 | 本版来源/状态 | 后续负责人 |
|---|---|---|
| 业务路径 | Report.paths 中的 ID、方向、规则ID、证据；不推断 relation 端点 | 图谱负责人/队长补节点字典、端点、条件和规则正文 |
| 节点公司联动 | 正式业务“数据不足”；TEST明确独立映射支持高亮→主动筛选 | 图谱负责人补 node_id→stock_code |
| 公司排名 | 真实报告总分/风险/证据/核验；保留0、缺分、未知枚举、失效引用 | 队长确认完整候选集及可空分语义（G05） |
| 三个分项 | API不足；文件Mock按 event_id+stock_code 读取 financial_scores | 队长/财务负责人确定报告或只读接口 |
| PR#9 新财务样例 | 已合入，未进入当前报告 API；本PR不重构总控 | 财务负责人/队长整合新评分输出 |
| PR#7 事件证据库 | 已合入，未作为当前 Mock API 注册源；不跨事件拼接 | 证据负责人/队长整合数据版本 |
| 运行信息 | 只展示 API 返回字段；文件模式不生成假服务记录 | 队长提供列表/运行查询能力 |

G01–G06 未全部解决，不能声称完整业务网络、真实节点公司联动或全部 PRD AC 已通过。本版是授权的首版可评审交付，TEST演示与实际报告严格分离。

## 验证与设计

```bash
cd frontend
source ../.venv/bin/activate
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
# 安装Chrome后，E2E自动启动Vite与后端；现有相同端口服务可复用
# 首次无浏览器：npx playwright install chrome
```

后端现有测试：仓库根目录 `python -m unittest discover -s tests -v`。本次27项前端单元测试、13个Chrome浏览器场景、37项后端测试；实际 API 联调与1440/1280/800视口检查。浏览器异常测试使用显式 TEST 夹具，不修改业务Mock。

Figma对象、截图、交互状态与视觉对照见 [V1设计交付](design/v1/README.md)。React使用源SVG图标与背景，节点/路径由运行时绘制，物理Spring以浏览器实测为准。未覆盖A/B/C及Visual Fidelity Master。
