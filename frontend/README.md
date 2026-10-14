# SkyNexus Frontend V1

React19 + TypeScript + Vite7 的单一研究工作台。完整启动、API联调、数据边界、验收与3分钟脚本见 [docs/FRONTEND_DEMO.md](../docs/FRONTEND_DEMO.md)。

```bash
npm ci
npm run dev
```

默认请求同源 `/api/v1/analyze`，开发代理指向本地8000。后端错误不会自动切换文件Mock。TEST网络、测试公司与测试记录在 `src/components/spatial/data.ts` 明确隔离，不接收业务评分对象。

- `src/adapters/`：API / 文件数据读取、字段适配、缺项/引用校验、请求失效保护。
- `src/components/SpatialGraph.tsx` 和 `spatial/`：空间操作、可中断Spring、路径、当前事件历史与上下文。
- `src/components/DrawerHost.tsx`：单层共享Modal、阅读位置、焦点和关闭。
- `src/App.tsx`：事件生命周期、报告展示、公司和证据研究入口。
- `e2e/`：真实后端及明确边界夹具的Chrome验收。

`public/assets/figma` 来自用户提供的A设计导出。`public/assets/fonts` 包含Roboto/Noto及原许可文本。图谱未采用未经证实的真实公司映射；保留已有 react-force-graph-2d 依赖，本版采用SVG确定布局以保留已批准的曲线、外置标签和相机控制。

构建产物及测试结果不提交。PR只交付必要代码、配置、测试、运行说明及本轮设计交付。

默认业务 ID 图谱消费 Report.paths，依据 GraphPath 的相邻节点契约确定端点；缺失名称/类别不补造。原空间 TEST 网络通过“打开独立 TEST 图谱”进入，保持与业务公司隔离。

## 跨平台检查与研究现场

使用 `npm run check:names` 检查代码模块名称。代码模块不能在同目录使用忽略大小写后相同的文件名主干（如 `BusinessGraph.tsx` 与 `businessGraph.ts`）；辅助模块现为 `businessGraphEdges.ts`。TypeScript 同时强制导入大小写一致。

CI 使用 Node24，在 Linux/macOS/Windows 执行 `npm ci`、命名检查、类型、Lint、单元与构建。macOS 日志记录磁盘格式及大小写探测结果；若 checkout 区分大小写，则在临时不区分大小写 APFS 卷验证。`node scripts/ci-platform-check.mjs` 可执行相同检查。全量浏览器联调运行于 Linux Chrome，不代表 Safari/Firefox 兼容承诺。

业务相机、保持模式和最近20条视角历史由 App 保存，打开/返回独立 TEST 不清空现场；换事件、数据源或重新分析会清空。状态仅保存在当前工作台内存。
