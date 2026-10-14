# Wind字段字典 V1

金额单位CNY_million（人民币百万元），亿元×100、万元÷100、元÷1,000,000。比例用百分数值，允许负增长率、负毛利率以及超过100的异常负债率并标记；不得机械截断原始数据。PE/PB/PS单位为倍。字段英文名为项目内部名称，**不是未经核验的Wind API字段代码**；导出时须记录实际字段ID与参数。

| 字段 | 中文定义/口径 | 频率与单位 |
|---|---|---|
| stock_code / company_name | 证券代码含交易所后缀/简称 | 000001.SZ格式 |
| report_period / period_type | 报告期/annual、quarter、market | YYYY-MM-DD；market报告期空 |
| as_of_date | 估值截面日；年度记录携带分析截面日 | YYYY-MM-DD |
| revenue | 营业收入，不混用营业总收入 | 年度/单季，百万元 |
| revenue_yoy | 营收同比；记录比较基期是否重述 | 年度，% |
| net_profit | 归属于母公司股东净利润，非扣非 | 年度/单季，百万元 |
| gross_margin | (营业收入−营业成本)/营业收入×100 | 年度/单季，% |
| operating_cash_flow | 经营活动产生现金流量净额 | 年度/单季，百万元 |
| rd_expense | 利润表研发费用，不是研发投入总额 | 年度，百万元 |
| inventory | 存货期末账面价值 | 年末，百万元 |
| accounts_receivable | 应收账款期末账面价值，不含应收票据合计 | 年末，百万元 |
| capex | 购建固定资产、无形资产和其他长期资产支付现金，资本开支代理 | 年度，百万元 |
| asset_liability_ratio | 总负债/总资产×100 | 年末，% |
| market_cap | 总市值非流通市值；A/H分股类价格和汇率须记录 | 同日，百万元 |
| pe_ttm | 滚动归母利润估值，亏损保留原值并标记不可比 | 同日，倍 |
| pb | 最新已披露净资产口径，记录实际Wind定义 | 同日，倍 |
| ps_ttm | 滚动营业收入估值 | 同日，倍 |
| total_return_1y | 后复权期末价/期初价−1，再×100；分红再投资定义需数据源确认 | 一年，% |
| volatility_1y | 简单日收益率样本标准差ddof=1×sqrt(252)×100 | 一年年化，% |
| currency_unit | 金额标准单位 | CNY_million |
| missing_reason | 必需指标为null的原因，非适用字段不当作缺失 | 文本 |
| source_url / source_title | 原始来源链接/标题，mock使用不可解析占位网址 | 文本 |
| published_date | 披露日；未知留空，不能用报告期冒充 | YYYY-MM-DD或空 |
| verification_status | verified、pending_verification、mock | 状态 |

范围：2023/2024/2025三个完整年度；2024Q3至2026Q2八季度；2026-10-13同日估值截面。三季报披露进度不同，V1固定共同完整八季窗口，后续统一滚动。

财务使用合并报表。流量项季度须为单季度；Q2=半年累计−Q1，Q3=前三季累计−半年累计，Q4=全年−前三季累计。毛利率不得差分，应由单季收入和单季成本计算。存货、应收是时点余额，不做差分。重述前后基期不可混用，不擅自覆盖原披露值。

CSV缺失写字面量null并给missing_reason，JSON用null。不同记录类型不适用的数值字段写null且不属于必需缺失。所有样例金融数据均是mock，只有20家公司代码和名称用于标识研究样本。

私有导出审查应补：实际取数时间、Wind字段ID/参数、公告日期、复权设置、币种和单位、重述状态、授权来源。不要将账户、Cookie、API Key、Wind导出或受限衍生数据提交到GitHub。

评分字段及边界见[SCORING_METHOD.md](SCORING_METHOD.md)。既有FinancialScore输出字段不变；详细评分结果附components、source_urls、missing_reason、verification_status、report_period、as_of_date和rank。
