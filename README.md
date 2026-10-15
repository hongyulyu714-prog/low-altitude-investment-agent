# 低空智研 · SkyNexus

**从事件出发，沿产业路径研究公司影响，并回到可追溯的原始证据。**

SkyNexus 面向低空经济政策、原材料价格、订单和重大事件，探索“事件 → 产业关系 → 公司 → 财务评分 → 证据”的投研工作流。当前仓库已包含可运行的总控 Mock API、React 研究工作台、确定性评分模块、事件证据样例及自动化验证。

> **当前演示边界：**默认报告使用 `mock-v1` 模拟数据。页面上的示例公司、财务评分、来源地址和结论用于验证接口与交互，不代表已核验的投资事实。新增 `prototype-v1` 已整合一个历史公告案例的图谱、映射、证据与合成评分；Wind 实际数据接入和正式业务映射验收仍需要后续协作。

![当前主工作台：报告业务 ID 图谱在上，公司宽表在下](docs/screenshots/03-business-1440.png)

本 README 按已合入的前端 V1 编写，截图对应实现提交 `86a440a`；该实现随 PR #11 合入 `main`，合并提交为 `f18c589`。截图采集信息见 [截图清单](docs/screenshots/manifest.json)。下文提供完整使用说明、当前页面图集和原 Figma 视觉参考。


### 版本化黄金链路 V1（Issue #14）

API 模式将“数据版本”选为 `prototype-v1`，选择“亿航宣布 EH216-S 获得型号合格证”后主动提交。`POST /api/v1/analyze` 输入 `{"event_id":"EVT_002","data_version":"prototype-v1"}`，从 SHA-256 固定的历史事件、图谱、公司映射、证据和合成财务生成报告。`GET /api/v1/events?data_version=prototype-v1` 返回该版本事件；未知版本或事件返回 422，不回退到 mock。

前端展示节点名称、明确公司映射、条件规则、评分分项与证据跳转。顺丰、苏交科使用已有合成样例计算，威海广泰缺财务输入保留 `null`；传导结论标为待核验。本案例不包含 Wind 原始导出，评分不是实际公司受益。启动、输入清单、数据缺口、测试与 3 分钟脚本见 [黄金链路 V1](docs/GOLDEN_CHAIN_V1.md)。下文既有截图及电池价格默认流程仍属于 `mock-v1`。

## 阅读导航

- [项目能力与当前进度](#capabilities)
- [快速启动：Linux / macOS / Windows](#quickstart)
- [工作台完整使用说明](#usage)
- [全部当前页面与状态截图](#screenshots)
- [Figma 设计页与历史视觉对照](#design)
- [API 调用与数据流](#api)
- [数据来源、评分与真实性边界](#data)
- [测试、构建与跨系统兼容](#validation)
- [常见问题](#faq)
- [三分钟演示脚本](#demo)
- [项目目录与贡献指南](#development)

<a id="capabilities"></a>

## 1. 项目能力与当前进度

### 1.1 目标业务链路

```text
事件输入 → 事件识别 → 产业链传导 → 公司筛选 → Wind 财务验证
        → 证据核验 → 确定性影响评分 → 可追溯投研报告
```

目标是将公司、产品、产业环节、事件和证据关联起来，让研究者能够理解影响方向、查看评分依据、发现风险并回到来源。文本证据与结构化财务数据分层处理，评分由确定性代码计算。

### 1.2 现在可以实际使用的能力

| 能力 | 当前实现 | 使用入口或限制 |
| --- | --- | --- |
| 已有事件分析 | 选择示例事件，主动提交后获取报告 | 不支持任意自然语言事件分析 |
| 总控 API | 健康检查、分析请求、报告生成、运行留痕 | 已注册 `mock-v1`、`prototype-v1` |
| 默认业务图谱 | 从当前报告读取节点 ID、相邻关系 ID、方向 | 缺失名称、类别与公司映射时不补造 |
| 业务相机操作 | 平移、缩放、保持视角、显式聚焦、复位、视角返回 | 最近 20 条相机历史，仅当前研究内存 |
| 路径研究 | 查看规则 ID 与路径证据 | 规则正文缺失仍显示“数据不足” |
| 公司比较 | 按报告总分排序，展示方向、风险、证据与核验状态 | “分析返回公司”不代表完整候选集 |
| 公司与证据详情 | 共用 480px 抽屉，逐层返回、恢复阅读位置和焦点 | Mock、来源可信度、核验状态分别表达 |
| 文件 Mock | 显式切换读取五类仓库 JSON | API 失败不会自动切换到此模式 |
| 独立 TEST 图谱 | 10 节点、9 关系、5 路径的空间交互演示 | 合成图谱、公司与记录不与业务数据混用 |
| 空间动效演示 | 可打断 Spring、微漂移、逐段路径高亮、暂停、Reduced Motion | 完整动效在 TEST 场景；业务 ID 图谱仍待深化 |
| 评分模块 | 三类事件、20 家临时研究样本的 Mock 评分复现 | `prototype-v1` 明确复用其中匹配公司的合成情景分项 |
| 产业图谱数据包 | PR #12 已交付 35 节点、50 关系、25 家公司映射和 10 条事件规则 | 位于 `data/graph/`；`prototype-v1` 已接入选定规则和映射，传导待核验 |
| 跨系统检查 | Linux、macOS、Windows 安装与构建验证 | 全量浏览器回归目前运行在 Linux Chrome |

### 1.3 仍需协作补齐

- 核验 `prototype-v1` 条件传导与公司产品映射，补齐其他事件的版本化输入及完整候选集语义。
- 由财务负责人提供授权财务与已批准的业务暴露度、事件敏感度；当前评分仍为合成样例。
- 威海广泰缺配套财务输入，评分保留空值。
- 授权 Wind 数据的正式验证、生产大图性能与业务图谱完整动效。
- 运行记录查询 API；版本化事件列表 API 已交付。

这些限制不会阻断已有 ID 路径的绘制，也不能通过猜测节点名称、按文本关联公司或从其他数据源暗补评分解决。产品详细边界见 [前端演示说明](docs/FRONTEND_DEMO.md)、[总控架构](docs/ARCHITECTURE.md) 和 [评分方法](docs/SCORING_METHOD.md)。

<a id="quickstart"></a>

## 2. 快速启动

### 2.1 环境要求

| 工具 | 建议版本 | 说明 |
| --- | --- | --- |
| Git | 本机可用版本 | 克隆代码；普通演示不需要初始化参考子模块 |
| Node.js | **24** | 与 CI 一致；项目 `engines` 要求 `>=22.12.0` |
| npm | 随 Node 安装 | 使用已提交的 `frontend/package-lock.json` 和 `npm ci` |
| Python | **3.12** | 与 CI 一致；当前演示代码使用 Python 3.10+ 语法 |
| Chrome | 浏览器测试时安装 | 日常浏览可先打开本机浏览器；完整自动化以 Chrome 为基准 |

前后端需要两个终端。Python 最小演示环境仅安装 FastAPI、Pydantic 2、Uvicorn 和 HTTPX；它不要求先安装 Neo4j、Wind 或全部图谱研究依赖。`backend/requirements.txt` 是更广泛的后端/图谱依赖清单，尚未完整锁定版本。

### 2.2 获取仓库

```bash
git clone https://github.com/hongyulyu714-prog/low-altitude-investment-agent.git
cd low-altitude-investment-agent
```

已有克隆时，先检查本地分支与未提交文件，再按团队流程同步。本文的前端入口应包含 `frontend/package-lock.json`、`src/` 和 `package.json` 中的运行脚本；若只看到依赖骨架，请确认当前检出提交已包含 PR #11。

### 2.3 Linux / macOS：终端一启动后端

在仓库根目录执行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install fastapi 'pydantic>=2,<3' uvicorn httpx
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

看到 `Uvicorn running on http://127.0.0.1:8000` 后保持该终端运行。

### 2.4 Linux / macOS：终端二启动前端

另开终端，进入仓库：

```bash
cd frontend
npm ci
npm run dev
```

打开 **http://127.0.0.1:5173/**。Vite 会代理 `/api` 和 `/health` 到 `http://127.0.0.1:8000`。

只使用前端界面时，第二个终端无需激活 Python 环境；运行会自动启动后端的 E2E 测试时，需要激活，见后文。

### 2.5 Windows PowerShell：终端一启动后端

以下命令不依赖虚拟环境激活脚本，避免把修改 PowerShell 执行策略作为启动前提。在仓库根目录执行：

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install fastapi "pydantic>=2,<3" uvicorn httpx
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

如果使用的 Python 不是通过 `py` 启动器安装，第一行改为 `python -m venv .venv`，后续命令不变。

### 2.6 Windows PowerShell：终端二启动前端

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

打开 **http://127.0.0.1:5173/**。使用 `npm.cmd` 可避免某些 PowerShell 环境中的 `npm.ps1` 执行策略限制。

### 2.7 不启动后端的浏览方式

1. 只启动前端。
2. 点击顶部 **文件 Mock**。
3. 选择“动力电池价格下降 15%（模拟事件）”。
4. 点击 **查看分析**。

文件模式可以浏览图谱、评分分项、风险与来源，不能生成真实服务运行记录。默认 API 模式遇到连接失败时会显示错误与重试，**不会自动降级为文件模式**。

### 2.8 端口、代理与停止服务

- 后端默认 `8000`，前端默认 `5173`；以 Vite 终端实际打印的地址为准。
- 同时运行两份项目时，先确认端口对应哪个工作目录，避免看到旧页面。
- 停止服务：分别在两个终端按 `Ctrl+C`。
- 若后端改为 `8001`，前端代理目标也需同步设置。

Linux / macOS：

```bash
SKY_BACKEND_URL=http://127.0.0.1:8001 npm run dev
```

Windows PowerShell：

```powershell
$env:SKY_BACKEND_URL = "http://127.0.0.1:8001"
npm.cmd run dev
```

`SKY_BACKEND_URL` 是 Vite 代理配置，不是浏览器内保存的登录或业务设置。前端静态构建不会自动提供后端服务；部署时仍需要同源反向代理和后端进程，本仓库当前没有生产部署流程。

<a id="usage"></a>

## 3. 工作台完整使用说明

### 3.1 第一次分析

1. 保持顶部 **后端 API** 为选中状态。
2. 在 **已有事件** 下拉框选择“动力电池价格下降 15%（模拟事件）”。
3. 点击 **查看分析**。仅选择事件不会主动分析。
4. 请求完成后查看事件方向、分析返回公司、证据和影响环节。
5. 向下浏览公司评分表、业务路径与原始证据。

当前默认样例返回 **3 家公司、3 条证据、4 个路径环节**。这些统计只属于当前报告，不代表系统全库数量、完整候选公司数量或真实市场覆盖。

加载期间展示等待态，不模拟 Agent 完成百分比。更换事件、切换数据源或重新分析会清除旧结果与研究现场，旧请求响应不会覆盖新的选择。

### 3.2 默认业务图谱

图谱中的标签是报告提供的节点 ID，例如 `NODE_BATTERY`、`NODE_EVTOL`。当前报告未携带节点名称或类别字典，因此节点使用中性 **ID** 表达；独立 `data/graph/` 数据包的交付不等于已经接入报告。

| 操作 | 结果 |
| --- | --- |
| 点击左侧路径 | 切换当前业务路径，清除当前节点选择 |
| 点击圆形节点，尚未手动操作相机 | 选择节点并自动居中，保留缩放 |
| 拖动空白区域 | 平移图谱，并进入“保持视角” |
| 滚轮或 `＋` / `−` | 缩放，并进入“保持视角” |
| 保持视角后再点击节点 | 只改变选择，不接管相机 |
| 点击 **聚焦节点** | 显式将当前节点居中，保留当前缩放 |
| 点击 **全局复位** | 将相机恢复到初始位置和缩放 |
| 点击 **视角返回** | 恢复上一条相机历史 |
| 点击 **展开图谱** | 暂时隐藏公司区，扩大图谱空间 |
| 点击 **收起图谱** | 恢复展开前的视角、选择、历史及滚动 |
| 点击短浮层 **查看规则与证据** | 在共享抽屉阅读当前路径及证据 |

**连线依据：**`GraphPath.node_ids` 按路径排列，`relation_ids[i]` 连接 `node_ids[i]` 与 `node_ids[i+1]`。只有数量符合契约时才绘制，不根据名称或 ID 字面含义猜测关系。

正、负、中性、不确定方向来自当前路径字段；不确定不等于负向或零影响。规则 ID、节点名称缺项和公司映射缺项仍保留在界面中。

### 3.3 公司评分比较

通过顶部 **公司与证据** 导航，或向下滚动进入公司宽表：

- 默认按真实返回的 `impact_score` 降序排列，可点击评分排序切换升序。
- 表格保留公司/证券代码、方向、三个评分分项、总分、主要风险、证据数量和核验状态。
- 总分为影响强度，**不是预计收益率、股价涨幅或公司质量排名**。
- 缺评分显示“数据不足”，已知 `0` 保留为 `0`，不把未知值补成零。
- 点击公司名称打开公司详情，阅读总分、风险、分项和关联证据。
- 宽表在较窄视口内可以横向滚动，页面继续保持图谱在上、表格在下。

默认 `mock-v1` 的 API 报告仍未提供三个分项；`prototype-v1` 可展示合成评分分项与公式。切换文件 Mock 后可读取该模式明确提供的分项；不会在 API 表格中偷偷混入文件数据。

### 3.4 公司 → 证据 → 返回研究现场

1. 打开“示例 eVTOL 整机公司”。
2. 查看实际 Mock 总分 `40.80` 与风险；API 分项显示不足。
3. 点击“模拟证据：电池价格输入”。
4. 核对标题、日期、短摘录、来源可信度、核验状态和链接。
5. 点击 **查看原始来源（新窗口）**，在新标签页打开来源。
6. 点击 **返回** 回到公司详情，恢复该层阅读位置。
7. 点击 **返回图谱现场** 关闭抽屉并恢复研究选择及上下文。

抽屉是同一层共享容器，不堆叠多层 Modal。`Escape` 或关闭按钮关闭详情；关闭后焦点回到原入口。`example.com` 地址是 Mock 示例来源，不能作为真实文章存在或结论已核验的证明。

### 3.5 来源与运行信息

公司区域的 **数据来源** 按钮打开来源说明。API 模式展示返回的报告 ID、运行 ID、数据版本、生成时间与相关边界；文件模式不编造服务运行记录。

本地后端运行留痕写入 `data/runs/`，该目录被 Git 忽略。界面没有提供运行记录列表或历史报告管理产品。

### 3.6 文件 Mock 的正确使用

点击 **文件 Mock** 后，需要重新选择事件并点击 **查看分析**。文件模式读取：

| 文件 | 用途 |
| --- | --- |
| `data/mock/events.json` | 已有事件 |
| `data/mock/graph_paths.json` | 路径 ID、相邻节点、关系、方向和规则引用 |
| `data/mock/companies.json` | 示例公司基础映射 |
| `data/mock/financial_scores.json` | 当前样例的真实文件评分与分项 |
| `data/mock/evidence.json` | 摘录、来源、状态及明确证券代码引用 |

这里的“真实文件评分”指**按文件原值展示的 Mock 数据**，不指真实市场或 Wind 已验证数据。文件模式没有源结论、报告运行信息等字段时，保留不足状态。

### 3.7 独立 TEST 空间探索

从默认图谱右上角点击 **打开独立 TEST 图谱**。这是交互演示入口，不是另一份业务报告。

- 场景包含 **10 个 TEST 节点、9 条合成关系、5 条路径**。
- 可以自由平移、缩放、拖动节点、选路径、聚焦、概览、回溯与展开。
- 初始保留自动聚焦辅助；手动操作立即进入保持视角，后续普通选择不移动相机。
- **恢复自动聚焦** 影响后续选择，不立即触发一次无预期飞行。
- 节点悬停展示短浮层预览；进入详情才改变研究选择。
- 左侧路径导航用于选择研究路径，不强制逐步导读。
- **重播路径**、暂停/继续、历史等用于观察已批准的空间行为。
- 顶部 **减少动态效果** 或系统 Reduced Motion 提供静态等价信息；图谱内保留暂停入口。

**TEST 公司联动：**切换公司区 **TEST 联动** 标签，选择节点 B 后先高亮关联公司；点击 **筛选关联 TEST 公司** 才主动筛选。Alpha/Beta/Gamma 和测试记录均为合成对象，不含业务证券代码、金融评分或真实来源。

点击 **返回业务 ID 图谱** 后，业务相机、保持模式、当前节点与路径、历史继续保留；重复往返不增加历史。更换事件、来源或重新分析则清空。TEST 的完整 Spring/微漂移动效不代表默认业务 ID 图谱已完成同等动效实现。

### 3.8 空、缺失、失败的区别

| 页面表现 | 含义 | 建议操作 |
| --- | --- | --- |
| 未选择事件 | 尚未开始研究 | 选择已有事件，再主动分析 |
| 分析中 | 请求尚未完成 | 等待或更换事件；不显示伪进度 |
| 请求失败 | 网络、HTTP 或解析异常 | 检查后端、查看错误并重试；可主动选文件 Mock |
| 暂无返回公司/路径/证据 | 服务明确返回空集合 | 不理解为零影响或系统故障 |
| 数据不足 | 字段缺失、未知或上游尚未交付 | 保留其他有效结果，不以 0 填补 |
| 待核验 | 真实枚举 `pending_verification` | 查看来源与后续核验 |
| Mock · 模拟 | 真实枚举 `mock` 或明确模拟数据属性 | 不转译为真实业务“未核验” |
| 引用不可用 | 证据 ID 不能在当前报告解析 | 保留缺失提示，不跨事件补证据 |

<a id="screenshots"></a>

## 4. 全部当前页面与状态截图

以下为当前实现的 **24 张浏览器截图**。除 1280/800 宽度图外，统一使用 1440×1024 比较视口；标注“完整页面”的截图包含视口以下的纵向内容。图片可点击查看原文件。

截图是浏览器实际渲染。请求错误、明确空报告、字段缺失三组使用显式 TEST 响应夹具；加载图通过延迟真实请求取得，不代表真实业务故障或新增业务数据。独立 TEST 图谱和公司始终与报告数据隔离。详细采集来源见 [manifest.json](docs/screenshots/manifest.json)。

### 4.1 默认业务研究

**未选择事件：**分析按钮尚不可用，无成功统计。

![未选择事件](docs/screenshots/01-entry.png)

**分析中：**等待请求，不模拟阶段或百分比。

![分析请求等待中](docs/screenshots/02-loading.png)

**业务首屏：**事件摘要、ID 图谱和公司区入口。

![1440×1024 业务首屏](docs/screenshots/03-business-1440.png)

<details>
<summary>查看完整纵向业务页面</summary>

![完整业务报告](docs/screenshots/04-business-full.png)

</details>

**节点焦点与保持视角：**选中节点、110% 缩放与详情入口。

![业务节点选择与保持视角](docs/screenshots/05-business-held.png)

**业务路径详情：**节点 ID、关系 ID、规则 ID 和证据入口。

![业务路径、规则与证据](docs/screenshots/06-business-path.png)

**展开图谱：**暂时隐藏公司区，收起后恢复现场。

![展开业务图谱](docs/screenshots/07-business-expanded.png)

### 4.2 公司、证据与来源

**公司详情：**总分、风险、缺失分项和关联证据。

![公司评分与风险](docs/screenshots/08-company.png)

**证据详情：**摘录、时间、可信度、核验状态和原始链接。

![证据共享抽屉](docs/screenshots/09-evidence.png)

**来源与运行信息：**当前数据版本、报告/运行标识及能力边界。

![数据来源与运行信息](docs/screenshots/10-sources.png)

### 4.3 文件 Mock

![文件 Mock 首屏](docs/screenshots/11-file-1440.png)

<details>
<summary>查看文件 Mock 完整页面与评分分项</summary>

![文件 Mock 完整内容](docs/screenshots/12-file-full.png)

</details>

### 4.4 独立 TEST 空间探索

**TEST 图谱：**类别节点、路径与空间操作，不代表实际产业映射。

![独立 TEST 空间探索](docs/screenshots/13-test-graph.png)

**TEST 节点详情：**明确节点身份、合成关联公司和业务规则缺项。

![TEST 节点详情](docs/screenshots/22-test-node.png)

<details>
<summary>查看 TEST 图谱与完整纵向内容</summary>

![TEST 完整页面](docs/screenshots/23-test-full.png)

</details>

**主动筛选：**TEST 公司联动，不改变业务 Mock 公司集合。

![TEST 公司主动筛选](docs/screenshots/14-test-companies.png)

**TEST 公司详情：**明确合成身份，无业务金融评分。

![TEST 公司详情](docs/screenshots/15-test-company.png)

**TEST 记录：**映射验证记录，无伪造真实来源。

![TEST 合成记录](docs/screenshots/16-test-evidence.png)

**TEST 展开：**空间交互与临时展开现场。

![TEST 图谱展开](docs/screenshots/17-test-expanded.png)

### 4.5 异常与数据边界

**请求错误：**显式 TEST HTTP 503 夹具，展示重试，不静默切换数据源。

![请求失败与重试](docs/screenshots/18-error.png)

<details>
<summary>查看明确空报告和字段缺失两种状态（显式 TEST 夹具）</summary>

**明确空报告：**集合为空，不等同零影响。

![明确空报告](docs/screenshots/19-empty.png)

**字段缺失：**数据不足，不抹掉其他字段，不补零。

![缺失字段](docs/screenshots/20-missing.png)

</details>

### 4.6 不同桌面视口

<details>
<summary>查看 1280px 和 800px 宽度截图</summary>

**1280px：**保留上下结构与公司宽表。

![1280px 桌面布局](docs/screenshots/21-responsive-1280.png)

**800px：**较窄桌面视口，表格仍可横向滚动；不代表移动端或触屏专项验收。

![800px 较窄桌面布局](docs/screenshots/21-responsive-800.png)

</details>

<a id="design"></a>

## 5. Figma 设计页与历史视觉对照

视觉基础为 **A · Graph Exploration + Spatial Exploration**，沿用 L01 Glacier Blue White、浅蓝白空间层次、柔和白色卡片、BankDash 表格语言，以及 Cambridge 类别节点和自然曲线。

**下方是原 V1 设计参考，不是当前默认业务图谱截图。**设计阶段采用独立 TEST 图谱验证视觉，后续 review 将实际业务 ID 路径接入默认页面。设计系统没有因本轮实现自动冻结。

### 5.1 可编辑 Figma 对象

| 页面 / 状态 | 实际 Figma 对象 ID |
| --- | --- |
| 独立 V1 Page | `40008328:40249` |
| 文件 Mock 完整页面 | `40008328:40250` |
| 文件 Mock 首屏 | `40008333:41056` |
| API 完整页面 | `40008334:41542` |
| API 首屏 | `40008334:42028` |
| API 证据抽屉 | `40008334:42514` |
| API 公司抽屉 | `40008334:44486` |
| 未分析状态 | `40008334:43016` |
| 加载状态 | `40008334:43506` |
| 请求错误状态 | `40008334:43996` |

当前交付记录没有可用 fileKey，因此这里只列实际对象 ID，不构造猜测的分享 URL。来源、复用、状态与导出限制见 [设计交付 README](docs/design/v1/README.md) 和 [视觉 QA](frontend/design-qa.md)。

### 5.2 全部 V1 设计状态图

下列 PNG 来自**实际 Figwright SVG 导出后在 Chrome 中渲染**。原生 Figma PNG 导出曾超时；SVG 不保留背景采样模糊，因此不能用这些图声称原生模糊导出已验证。

<details>
<summary>API 首屏与完整页面</summary>

![Figma API 首屏：历史 TEST 视觉基准](docs/design/v1/evidence/figma-api-1440.png)

![Figma API 完整页面](docs/design/v1/evidence/figma-api-full.png)

</details>

<details>
<summary>文件 Mock 首屏与完整页面</summary>

![Figma 文件 Mock 首屏](docs/design/v1/evidence/figma-file-1440.png)

![Figma 文件 Mock 完整页面](docs/design/v1/evidence/figma-file-full.png)

</details>

<details>
<summary>公司与证据抽屉</summary>

![Figma 公司详情](docs/design/v1/evidence/figma-api-company.png)

![Figma 证据详情](docs/design/v1/evidence/figma-api-evidence.png)

</details>

<details>
<summary>未分析、加载和错误状态</summary>

![Figma 未分析](docs/design/v1/evidence/figma-entry.png)

![Figma 加载](docs/design/v1/evidence/figma-loading.png)

![Figma 请求错误](docs/design/v1/evidence/figma-error.png)

</details>

### 5.3 历史实现截图与对照

以下保留初版实现和首轮 review 的记录，便于追溯；**日常操作以第 4 节当前截图为准**。

<details>
<summary>展开全部已交付的历史实现与对照图</summary>

![初版 Figma / React 同尺度对照](docs/design/v1/evidence/comparison-overview.png)

![初版 React API 首屏：TEST 图谱](docs/design/v1/evidence/react-api-1440.png)

![初版 React 文件 Mock 全页](docs/design/v1/evidence/react-file-full.png)

![初版 React 证据抽屉](docs/design/v1/evidence/react-api-evidence.png)

![首轮 review 接入业务 ID 图谱后的首屏](docs/design/v1/evidence/review-business-1440.png)

</details>

<a id="api"></a>

## 6. API 调用与数据流

### 6.1 运行中的接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/health` | 健康检查，返回默认数据版本 |
| `GET` | `/api/v1/events?data_version=prototype-v1` | 读取指定版本的事件列表 |
| `POST` | `/api/v1/analyze` | 根据注册事件和版本返回分析报告 |
| `GET` | `/docs` | FastAPI 自动生成的接口文档 |

直接访问后端：http://127.0.0.1:8000/docs 。`/docs` 是框架提供的 API 文档，不是另一个产品研究页面。

### 6.2 Linux / macOS 请求示例

```bash
curl http://127.0.0.1:8000/health

curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H 'Content-Type: application/json' \
  -d '{"event_id":"EVT_BATTERY_PRICE_DOWN_001","data_version":"mock-v1"}'
```

### 6.3 Windows PowerShell 请求示例

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"

$body = @{
  event_id = "EVT_BATTERY_PRICE_DOWN_001"
  data_version = "mock-v1"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/v1/analyze" `
  -ContentType "application/json" `
  -Body $body
```

### 6.4 报告字段与前端使用

| 报告内容 | 前端呈现 |
| --- | --- |
| `event` | 事件名称、时间、方向与来源属性 |
| `paths` | 业务节点 ID、相邻关系、方向、规则 ID、路径证据 |
| `companies` | 公司总分、方向、风险、证据引用与核验状态 |
| `evidence` | 标题、日期、摘录、可信度、状态、来源链接 |
| `conclusions` | 服务端返回的结论及证据引用；文件模式不生成替代结论 |
| `run_id` / `report_id` | 来源与运行信息；文件模式不伪造 |
| `data_version` / `generated_at` | 数据追溯信息 |

契约唯一字段定义见 [contracts/models.py](contracts/models.py)。当前错误使用可读信息返回；未知事件、未注册版本、路径或评分不合法等总控错误转为 HTTP `422`。缺少必要请求字段也会触发契约校验错误。

### 6.5 数据流和适配边界

```text
后端 API 模式：
data/mock/ 五类注册输入
  → InvestmentOrchestrator
  → contracts.Report
  → POST /api/v1/analyze
  → frontend/src/adapters/
  → 工作台、业务图谱、公司表、共享抽屉

文件 Mock 模式：
data/mock/ 同版本五类 JSON
  → frontend/src/adapters/
  → 保留字段缺失与来源边界
  → 工作台

独立 TEST：
frontend/src/components/spatial/data.ts
  → 合成节点 / 关系 / 公司 / 记录
  → 仅用于空间交互与映射演示
```

页面不直接耦合未来后端结构；数据适配器负责读取、归一化、异常和失效引用提示。业务关联以同一 `event_id` 和明确引用为准，不根据公司名、产业角色或证据文本猜测映射。

<a id="data"></a>

## 7. 数据来源、评分与真实性边界

### 7.1 不同数据组不能混为一体

| 数据组 | 实际用途 | 不应据此宣称 |
| --- | --- | --- |
| 当前 `data/mock/` 五类 JSON | 已注册 `mock-v1` API 与文件演示 | 真实市场事实或完整候选公司库 |
| PR #7 事件证据库与 PR #9 财务评分样例 | 独立模块的数据/评测/评分成果 | 已全部进入当前报告 API |
| PR #12 `data/graph/` | 独立产业图谱、公司映射、规则与来源核查成果 | 已自动进入当前 `mock-v1` 报告，或技术关系已证明公司利润方向 |
| TEST 空间场景 | 视觉、交互、映射和回溯验证 | 实际节点公司关联、真实金融评分 |

PR #12 已提供 35 个节点、50 条关系、25 家公司映射和 10 条事件规则。其来源核查中，35 个节点、42 条技术/应用关系获得直接资料支持；8 条关系和 10 条完整事件传导假设仍为 `pending_verification`。技术功能支持不等于公司受益或利润方向已核验；公司映射的匹配度与核验口径需按原交付记录阅读。详见 [图谱数据说明](data/graph/README.md) 与 [来源核查](data/graph/SOURCE_REVIEW.md)。

### 7.2 数据属性、可信度和核验状态

三个维度分别解释：

- **Mock 属性：**数据是否为模拟或合成。
- **来源可信度：**来源分级，保留原始枚举，不等于已完成核验。
- **核验状态：**`verified`、`pending_verification`、`mock` 分别表达已核验、待核验、Mock 模拟。

可信度高不等于已核验；`verification_status=mock` 不能翻译成真实业务“未核验”。来源链接还需实际访问和人工判断，程序中的枚举并不代替事实核查。

### 7.3 确定性评分模块

公司影响评分 V1 是可解释的情景筛选规则，不是股价预测或经过历史拟合的因果模型。各分项与总分均使用 0–100 口径：

```text
Impact = Exposure × Sensitivity × FinancialMateriality / 10000
```

`FinancialMateriality` 描述利润、现金流缓冲和杠杆带来的敏感程度，不是财务健康度。公式版本、权重、缺失处理和行业局限见 [SCORING_METHOD.md](docs/SCORING_METHOD.md)，字段见 [WIND_DATA_DICTIONARY.md](docs/WIND_DATA_DICTIONARY.md)。前端只展示已有来源值，不重新计算或倒推分项。

无需 Wind 账号可以执行独立 Mock 评分演示：

```bash
python -m backend.scoring --allow-mock --output data/private/company_impact.json
```

这会向被 Git 忽略的 `data/private/` 写入结果。20 家研究样本与示例数值均为临时/模拟研究材料；不加 `--allow-mock` 会拒绝默认模拟输入。运行该命令不会自动把新的评分结果接入报告 API。

### 7.4 原始数据与受限材料

Wind 原始导出、账号、Cookie、API Key、付费研报和受限全文不提交。只提交公开/脱敏样例、字段口径与处理代码。

- `data/raw/`：私有原始数据位置，Git 忽略。
- `data/private/`：私有处理和评分输出位置，Git 忽略。
- `data/runs/`：总控运行留痕，Git 忽略。
- `data/templates/`：CSV 表头模板，不是业务数据。

数据标准见 [DATA_COLLECTION_STANDARD.md](docs/DATA_COLLECTION_STANDARD.md)、[证据标准](docs/EVIDENCE_STANDARD.md)、[模板说明](data/templates/README.md)。

<a id="validation"></a>

## 8. 测试、构建与跨系统兼容

### 8.1 常用前端命令

以下命令在 `frontend/` 中执行：

| 命令 | 功能 |
| --- | --- |
| `npm ci` | 从锁文件安装依赖 |
| `npm run dev` | 启动 Vite 开发服务 |
| `npm run check:names` | 检查跨文件系统的代码模块命名歧义 |
| `npm run typecheck` | TypeScript 类型与导入大小写检查 |
| `npm run lint` | ESLint 检查 |
| `npm test` | Vitest 单元测试 |
| `npm run build` | 类型检查与生产静态构建，输出到 `frontend/dist/` |
| `npm run preview` | 本地预览构建结果；仍需可用后端 |
| `npm run test:e2e` | Playwright 浏览器回归，自动启动所需服务 |
| `node scripts/ci-platform-check.mjs` | 从安装开始执行与平台 CI 一致的检查 |

Windows PowerShell 可将上表 `npm` 写为 `npm.cmd`。构建输出、缓存和测试 trace 不提交。

### 8.2 后端测试与命令行演示

在仓库根目录使用已安装演示依赖的 Python：

```bash
python -m unittest discover -s tests -v
python -m backend.orchestrator
```

命令行总控演示会生成报告和本地运行记录；相关逻辑见 [总控架构](docs/ARCHITECTURE.md)。

### 8.3 Linux / macOS 浏览器测试

```bash
# 从仓库根目录进入测试环境
source .venv/bin/activate
cd frontend
npm ci
npx playwright install chrome
npm run test:e2e
```

Linux 若缺浏览器系统依赖，可按 CI 使用：

```bash
npx playwright install --with-deps chrome
```

Playwright 配置会在 `5173` 和 `8000` 启动前后端。本地已有同端口服务时可以复用，请确认它们来自当前代码目录。不要同时启动多个测试进程写入同一个 `frontend/test-results/`，否则 trace 产物可能互相覆盖。

### 8.4 Windows PowerShell 浏览器测试

```powershell
# 仓库根目录，将项目 Python 环境加入当前终端 PATH
$env:Path = "$((Resolve-Path .venv\Scripts).Path);$env:Path"
cd frontend
npm.cmd ci
npx.cmd playwright install chrome
npm.cmd run test:e2e
```

Windows 已通过安装、命名、类型、Lint、单元和构建 CI；上述浏览器命令供本地使用，当前 CI **没有执行 Windows/macOS 全量浏览器测试**。

### 8.5 跨系统命名规则

代码模块不能依赖大小写和扩展名顺序区分职责。例如 `BusinessGraph.tsx` 与 `businessGraph.ts` 在不区分大小写的文件系统中会导致模块解析歧义；辅助模块已改为 `businessGraphEdges.ts`。

防回归措施包括：

1. 代码模块去扩展名后，检查同目录中忽略大小写的名称冲突。
2. TypeScript 显式启用 `forceConsistentCasingInFileNames`。
3. Linux、macOS、Windows 使用 Node 24 从 `npm ci` 开始检查。
4. macOS 记录磁盘格式并探测大小写行为；若工作目录区分大小写，则转到临时不区分大小写 APFS 卷验证。

不通过设置 `core.ignorecase`、关闭类型检查或修改解析扩展名优先级绕过源码冲突。

### 8.6 最近完整验证记录

实现提交 `86a440a` 的验证结果：

| 范围 | 结果 |
| --- | --- |
| 前端单元测试 | 31 项通过 |
| Linux Chrome 浏览器场景 | 20 项通过 |
| 后端测试 | 37 项通过 |
| Linux / macOS / Windows 平台检查 | 安装、命名、类型、Lint、单元与构建均通过 |
| macOS 故障环境覆盖 | 实际工作目录为不区分大小写的 APFS，类型检查与构建通过 |
| 仓库质量检查 | 通过 |

远端证据：[PR 检查](https://github.com/hongyulyu714-prog/low-altitude-investment-agent/actions/runs/38598805402)、[push 检查](https://github.com/hongyulyu714-prog/low-altitude-investment-agent/actions/runs/38598799711)。它们是指定提交的结果，不代表所有未来提交或所有浏览器已经验证。

浏览器覆盖真实 API、文件模式、路径与四方向、公司/证据、保持视角与相机历史、TEST 往返、展开恢复、阅读/焦点、空/缺项/失败、失效引用、安全来源链接、旧请求隔离、Reduced Motion、漂移上限及暂停。完整业务图谱与生产性能验收仍有独立依赖。

<a id="faq"></a>

## 9. 常见问题

| 问题 | 原因与处理 |
| --- | --- |
| 页面打开后没有公司或图谱 | 先选择已有事件，再点击“查看分析”；初始页不伪造结果 |
| 提示后端不可用 | 检查 `8000` 服务和 `/health`；保持 API 模式重试，或主动切文件 Mock |
| 前端端口不是 `5173` | 端口可能已被占用，查看 Vite 实际地址；自动化测试使用固定端口 |
| API 有总分却没有三个分项 | `mock-v1` 数据未提供；`prototype-v1` 支持合成分项，不能暗补其他来源 |
| 图谱只显示 `NODE_...` | 默认 mock 缺字典时展示 ID；`prototype-v1` 已返回节点名称 |
| 节点没有联动业务公司 | 当前报告未接入独立图谱公司映射；不能按公司名、角色或证据文本猜测 |
| 为什么 TEST 能筛选，公司业务表不能 | TEST 使用明确的合成映射，不能作为业务映射使用 |
| 来源新窗口没有真实文章 | 当前默认使用 `example.com` Mock 示例链接；查看数据模式与来源标记 |
| 切换来源后选择清空 | 属于上下文隔离设计，需要重新选择事件并分析 |
| 返回 TEST 后业务视角是否保留 | 当前实现会保留相机、保持模式和相机历史；重新分析或换事件才清空 |
| 看不到微漂移或路径动画 | 检查是否处于业务 ID 图谱、是否开启 Reduced Motion 或暂停；完整演示位于独立 TEST 图谱 |
| macOS 出现 `TS2305` / `TS1261` / `TS1149` | 确认包含改名修复；检查导入大小写和同主干模块名，运行 `npm run check:names` |
| Windows 阻止 `Activate.ps1` / `npm.ps1` | 启动后端可直接用虚拟环境 Python；前端使用 `npm.cmd`，无需先调整全局执行策略 |
| E2E 找不到 `uvicorn` 或 FastAPI | 测试终端使用了其他 Python；激活/加入项目虚拟环境 PATH 后再运行 |
| Playwright 找不到 Chrome | 执行 `npx playwright install chrome`；Linux 系统依赖不足时使用 `--with-deps` |
| 构建成功却不能分析 | 静态前端构建不会启动后端；检查服务与同源代理 |
| Neo4j 或 Wind 没安装能否演示 | 当前 Mock HTTP 与文件演示不需要它们；真实接入需另行配置 |
| CI 全绿是否代表完整需求验收 | 不代表；映射、规则、API 分项及正式数据仍有缺口 |

<a id="demo"></a>

## 10. 三分钟演示脚本

| 时间 | 操作 | 讲解重点 |
| --- | --- | --- |
| 0:00–0:25 | 介绍 Mock 边界，默认 API 选择电池价格事件并分析 | 主动提交；统计仅基于当前报告 |
| 0:25–0:55 | 点击 `NODE_EVTOL`、缩放和平移、再点节点、显式聚焦 | 业务路径来自相邻节点契约；用户手动视角优先 |
| 0:55–1:25 | 通过顶部“公司与证据”进入公司表，打开 eVTOL 公司 | 总分、方向、风险；分项不足可见 |
| 1:25–1:55 | 公司 → 电池证据 → 打开来源 → 返回现场 | 原摘录、可信度和核验分离；Mock URL 不冒充真实文章 |
| 1:55–2:20 | 打开数据来源，再展示文件 Mock 的分项 | 两种来源明确隔离；没有伪服务运行记录 |
| 2:20–2:50 | 打开独立 TEST，选择 B、切 TEST 联动并主动筛选 | 空间操作与映射验证；合成公司没有业务评分 |
| 2:50–3:00 | 返回业务图谱，说明当前上游缺口 | 现场恢复；不宣称完整业务验收或正式投资结论 |

<a id="development"></a>

## 11. 项目目录与贡献指南

### 11.1 当前目录

```text
backend/                   总控 HTTP、版本化编排、确定性评分模块
contracts/                 Pydantic 跨模块 JSON 字段定义
frontend/
  src/adapters/            API/文件适配、归一化、引用与请求隔离
  src/components/          业务/TEST 图谱、共享详情抽屉
  src/components/spatial/  TEST 数据、空间几何、Spring、悬停与样式
  public/assets/           设计来源 SVG、字体与许可
  scripts/                 模块命名和平台验证脚本
  e2e/                     Chrome 回归场景
  package-lock.json        npm 锁文件
  dist/                    本地构建产物，不提交
data/
  mock/                    mock-v1 五类 Mock JSON
  versions/                prototype-v1 受控清单与输入哈希
  graph/                   PR #12 产业图谱、公司映射、规则与来源核查
  templates/               字段表头模板
  private/                 私有输出，不提交
  runs/                    运行留痕，不提交
docs/
  screenshots/             当前页面/状态截图与采集清单
  design/v1/               Figma 对象、历史对照与截图
  tasks/                   各 Issue 职责与执行卡
tests/                     后端/数据/评分测试
references/                开源参考与复用边界
third_party/               Git 子模块入口
.github/workflows/         仓库质量与前端三平台/浏览器 CI
```

目录树只列当前实现及运行产物位置。产业图谱数据位于实际存在的 `data/graph/`，不是目标架构中的顶层 `graph/`；其中选定的适航规则与产品映射已进入 `prototype-v1`，不替换 `mock-v1`。可在根目录执行 `python scripts/validate_graph_data.py` 检查图谱数据。

### 11.2 进一步阅读

| 文档 | 内容 |
| --- | --- |
| [黄金链路 V1](docs/GOLDEN_CHAIN_V1.md) | 版本化历史公告、合成评分、数据边界与演示 |
| [前端演示与验收](docs/FRONTEND_DEMO.md) | 启动、数据边界、review 修复与演示流程 |
| [前端工程说明](frontend/README.md) | 组件职责与工程命令 |
| [设计交付](docs/design/v1/README.md) | 实际 Figma Page/Frame ID、复用、截图来源 |
| [视觉 QA](frontend/design-qa.md) | 历史视觉对照、残差与交互验证边界 |
| [总控架构](docs/ARCHITECTURE.md) | 注册数据源、关系契约、失败策略与留痕 |
| [评分方法](docs/SCORING_METHOD.md) | 分项、公式、缺失处理与模拟边界 |
| [Wind 字段字典](docs/WIND_DATA_DICTIONARY.md) | 数据口径与字段解释 |
| [证据标准](docs/EVIDENCE_STANDARD.md) | 来源、核验与数据约束 |
| [产业图谱数据说明](data/graph/README.md) | 节点、关系、公司映射、规则及独立核验边界 |
| [数据收集标准](docs/DATA_COLLECTION_STANDARD.md) | ID、日期、单位和交付口径 |
| [团队分工](docs/TEAM_WORK.md) | 模块责任与协作 |
| [GitHub 工作流](docs/GITHUB_WORKFLOW.md) | 分支、PR 与检查流程 |
| [组织协作指南](docs/ORGANIZATION_COLLABORATION.md) | 权限、Teams、看板和组织协作说明 |
| [GitHub + Codex 新手指南](docs/GITHUB_CODEX_BEGINNER_GUIDE.md) | Issue、分支、Commit、Review、Merge 的操作说明 |
| [执行卡](docs/tasks/) | 各 Issue 的任务与验收边界 |
| [开源参考](docs/OPEN_SOURCE_REFERENCES.md) | 外部项目使用计划与许可边界 |

### 11.3 开源复用与设计来源

| 项目 / 资源 | 当前用途 |
| --- | --- |
| `multi-agent-investment` | `third_party/multi-agent-investment` Git 子模块参考；不表示默认演示依赖其完整运行环境 |
| `neo4j-graphrag` | 后端/图谱依赖清单中的后续能力基础 |
| `react-force-graph-2d` | 保留在前端依赖；当前图谱使用 SVG 实现确定布局与曲线控制 |
| A / BankDash / Cambridge 设计资源 | 当前视觉来源；使用已交付 SVG、节点与表面语言，不表示复制整套外部前端源码 |
| Roboto / Noto 字体 | 随前端资源保留原许可文本 |

只有需要研究子模块源码时再执行：

```bash
git submodule update --init --recursive
```

完整说明见 [references/README.md](references/README.md)。复用外部代码先核对许可证，仓库中的来源记录不等于所有资源均可任意再分发。

### 11.4 协作规则

- 从对应 Issue 创建任务分支，一个 PR 对应一个可验证目标，不直接向 `main` 推送。
- PR 写清问题、结果、验证命令与数据来源；接口变化同步维护契约和文档，由相关负责人评审。
- 字段遵循共享 `snake_case`；ID、日期、金额单位、分数和缺失语义不在前端擅自改变。
- 新截图标明当前实现、历史设计或 TEST 夹具，避免把设计效果图当运行证据。
- 不提交 Wind 原始导出、账号、Cookie、密钥、受限全文、构建产物和测试缓存。
- 当前截图与自动化通过不自动冻结设计系统，也不替代正式业务数据和人工验收。
