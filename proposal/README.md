# 低空智研计划书写作模板

用于金融人工智能大赛，目标50页，包含封面、目录和附录。**这里只将计划书写作改为两人负责，项目原有五人研发分工保持不变。**

[查看50页模板PDF](template-preview.pdf) · [查看封面](preview-cover.png)

## 开始写作

1. 模板PR合入后从最新 `main` 建立个人写作分支；若想提前开始，可从模板分支建立分支，模板合入后再同步 `main`。
2. 让 Codex **按名称下载并使用 `nature-writing` 和 `anti-defensive-writing` 两个技能**。无需在仓库提交技能文件或安装证明。
3. 告诉 Codex 本文是中文金融人工智能比赛计划书。借鉴技能的论证与写作原则，不套英文论文结构，不翻译成英文。
4. 阅读本人Issue与本目录 `AGENTS.md`，替换所分配页面的指引、图表占位和待补内容。
5. 编译完整计划书，检查本人负责的全部页面，按下文规定提交PR。

写作任务：[吕洪宇 #17](https://github.com/hongyulyu714-prog/low-altitude-investment-agent/issues/17) · [武桐宇 #18](https://github.com/hongyulyu714-prog/low-altitude-investment-agent/issues/18)

## 两人分工

| 作者 | 账号 | 页位 | 数量 | 写作范围 |
| --- | --- | --- | ---: | --- |
| 吕洪宇 | `hongyulyu714-prog` | 1—4、9—20、26—27、31—32、39—43 | 25 | 前置材料、概要、产品、技术、评测设计与结果、实施、团队 |
| 武桐宇 | `Eazin-stefan3199` | 5—8、21—25、28—30、33—38、44—50 | 25 | 行业需求、数据评分、三类案例、创新竞争、商业、财务、风险、价值、附录 |

逐页目标、所需材料和核对重点见 [page-plan.json](page-plan.json)，每页 `.tex` 内也写有同样说明。页位是内容预算；若正文过长，LaTeX会自然溢出，不会自动压缩到一页。两人共同完成后由吕洪宇统稿调整为约50页，不用缩小字体、删必要证据或留空白凑页数。

## 文件约定

- `main.tex`：唯一完整文档入口，按顺序载入50个页面文件。
- `config.tex`：共享排版，A4、中文小四、Fandol字体、统一页眉页脚与表格样式。
- `pages/p01.tex` 至 `pages/p50.tex`：作者只修改分配给自己的页位文件。
- `assets/<账号>/`：个人图表文件，来源记入本人证据账本。
- `references/lhy.tex`、`references/wty.tex`：个人参考文献，键分别使用 `lhy-`、`wty-` 前缀。
- `evidence/<账号>.csv`：关键主张、图表、外部事实及数字的来源、日期、定位、核验和数据状态。
- `submissions/<账号>/SELF_REVIEW.md`：本人写作PR的自检记录；同目录提交 `planbook.pdf` 作为完整编译预览。
- `template-preview.pdf`：模板的50页预览，不是项目计划书终稿。

共享文件 `main.tex`、`config.tex`、`page-plan.json` 的变化先在Issue说明，再单独PR或协调由吕洪宇处理；避免两人同时改模板。不要将本轮写作任务变成业务代码重构。

## 编译

使用完整TeX Live / MacTeX中的XeLaTeX，或Tectonic。模板不依赖本机商业字体，不需要shell escape或Biber。

在仓库根目录执行：

```sh
cd proposal
mkdir -p build
latexmk -xelatex -interaction=nonstopmode -halt-on-error -outdir=build main.tex
```

使用Tectonic可将最后一行替换为：

```sh
tectonic -X compile --outdir build --keep-logs main.tex
```

输出为 `proposal/build/main.pdf`。将本人写作PR的完整预览另存为 `proposal/submissions/<账号>/planbook.pdf`；不提交 `build/`、缓存、辅助文件、私有数据和账户凭据。在线LaTeX编辑器选择 **XeLaTeX**、入口 `main.tex`，并保留整个 `proposal/` 目录结构。

## 写作结果必须通过PR交付

| 作者 | 建议分支 | PR标题 | 对方审阅人 |
| --- | --- | --- | --- |
| 吕洪宇 | `codex/proposal-lhy` | `[计划书正文] 吕洪宇 25页初稿` | `Eazin-stefan3199` |
| 武桐宇 | `codex/proposal-wty` | `[计划书正文] 武桐宇 25页初稿` | `hongyulyu714-prog` |

使用计划书专用PR模板：新建PR链接追加 `template=proposal.md`，或把 `.github/PULL_REQUEST_TEMPLATE/proposal.md` 的内容复制到PR说明。

PR必须同时包含：

1. 本人页位的完整LaTeX正文和实际使用的图表；已替换本人的 `WritingGuide`、`NeedEvidence`、`FigureSlot` 指引/占位。正式字体与版式保持统一。
2. 本人的参考文献和证据账本。已实现、实测、模拟、推断和规划按实际状态标注；缺资料列入自检，不能编造财务、效果、客户或合作进展。
3. 完整编译的 `planbook.pdf`、实际编译命令和检查结果；PR中列出总页数，并说明对应页位。本人页面逐页检查中文、公式、图表、页码、引用、溢出和空白。
4. 填好的 `SELF_REVIEW.md`；简要确认两个技能已经下载并用于本轮写作，无需提交安装证明。
5. `Closes #本人Issue编号`，并请求另一名作者审阅。只有内容和证据齐全后才关闭Issue；阶段草稿用 `Refs #编号`，避免提前自动关闭。

分工中的25页是页位预算，并非要求个人PR单独拼出25页PDF。每个PR都编译同一份完整文档，未交付方的页面可能暂时保留模板；不得冒充50页已完成。

两人初稿合入后，吕洪宇另开统稿PR，统一术语、补交叉引用、消除重复、核对案例与实验、调整篇幅，并将 `config.tex` 设为 `\draftversionfalse`。终稿不得保留待补标记和模板封面文字。
