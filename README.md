# 低空智研｜低空经济产业链投研智能体（队伍：SkyNexus）

面向低空经济政策、原材料价格、订单与重大事件的金融投研系统。系统通过产业链知识图谱推演影响路径，使用 Wind 财务数据验证上市公司影响，并给出带原始证据的结构化投研结论。

## 核心链路

```text
事件输入 → 事件识别 → 产业链传导 → 公司筛选 → Wind 财务验证
        → 证据核验 → 影响评分 → 投研报告
```

## 核心创新

- **低空经济“公司—产品—产业环节—事件—证据”金融知识图谱**；
- **事件传导评分**：`业务暴露度 × 传导敏感度 × 财务重要性`；
- **文本证据和结构化财务数据分层处理**，并逐条展示证据来源；
- **事件、图谱、财务和证据四类 Agent 并行分析**，最终由确定性规则汇总。

## 仓库结构

```text
backend/       # Agent 编排、数据服务和评分计算
frontend/      # 交互界面、图谱及报告可视化
data/          # Wind 导出数据、事件和证据（原始数据不提交）
graph/         # 产业链节点、关系和传导规则
contracts/     # 前后端与各 Agent 的统一 JSON 接口
docs/          # 分工、开源项目参考、数据口径和答辩材料
tests/         # 标准测试案例和回归测试
```

详见：[团队分工](docs/TEAM_WORK.md)、[数据收集与交付标准](docs/DATA_COLLECTION_STANDARD.md)、[各 Issue 执行卡](docs/tasks/) 与 [开源项目使用方案](docs/OPEN_SOURCE_REFERENCES.md)。

## 本地总控演示（mock）

Issue #1 已提供一个可替换数据源的端到端示例。示例仅验证接口和流程，所有公司、评分、来源和结论均为 mock，不构成事实或投资建议。

```bash
python -m unittest discover -s tests -v
python -m backend.orchestrator
uvicorn backend.main:app --reload
```

启动服务后可调用 `POST /api/v1/analyze`，请求体为 `{"event_id":"EVT_BATTERY_PRICE_DOWN_001"}`。接口字段与运行留痕说明见 [总控架构](docs/ARCHITECTURE.md)。

## 已接入的开源基础

> [!TIP]
> **参考项目不是只放链接：已许可证核验的多 Agent 源码以 Git 子模块加入；图谱和前端组件已写入依赖骨架。**

| 项目/组件 | 仓库内位置 | 负责成员 | 最终自研成果 |
|---|---|---|---|
| `multi-agent-investment` | `third_party/multi-agent-investment` | 吕洪宇、范笑薇 | 总控 Agent、Wind 评分融合逻辑 |
| `neo4j-graphrag` | `backend/requirements.txt` | 武桐宇、刘芯妤 | 低空产业链关系查询与事件传导 |
| `react-force-graph-2d` | `frontend/package.json` | 孙奇衍 | 可动态高亮的产业链影响图 |

查看 [参考项目与实际接入清单](references/README.md)，其中也明确区分了“可直接接入”和“只能参考思路”的项目。

## GitHub Organization 协作

本项目归属于 GitHub Organization **Koukou is King**。组织用于集中管理成员、仓库、任务和比赛资产，避免项目只绑定在某一名成员的个人账号上。

> [!TIP]
> **团队成员每天只需四步：领取 Issue → 指挥 Codex 在任务分支完成 → 创建 Pull Request → 通过检查和评审后合并。**

队长负责 **Organization 权限、`main` 合并和比赛最终提交**；成员默认只需要仓库 **Write** 权限，无需管理仓库设置。

完整的权限设置、Teams、看板、Discussion 与协作流程见 [组织协作指南](docs/ORGANIZATION_COLLABORATION.md)。

## GitHub 新手先看这里

> [!TIP]
> **第一次使用 GitHub 的队员，请先阅读 [零基础 GitHub + Codex 协作指南](docs/GITHUB_CODEX_BEGINNER_GUIDE.md)。**
>
> 它解释了仓库、Issue、分支、Commit、PR、Review、Merge 分别是什么，并提供了可直接复制给 Codex 的任务提示词。

## 协作原则

> [!WARNING]
> **不要直接向 `main` 推送，也不要上传 Wind 原始导出、账号、密钥或受限研报全文。**

每人从第一天起在独立分支完成可运行模块；所有模块必须符合 `contracts/` 中的接口；每项结论应保留 **数据来源、时间、规则与计算过程**。
