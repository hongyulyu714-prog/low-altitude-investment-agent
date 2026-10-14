# 原始证据复核记录

数据版本：`event-evidence-v1-2026-10-12`。复核人：Codex。日期：2026-10-12（北京时间）。

采用原始网页正文读取和指定披露平台 PDF 阅读，逐条比对日期、片段、定位与事实边界。搜索摘要仅用于发现线索；无法读取的西宁开发区、青岛重定向页及国资委候选已排除。本机直接请求部分站点遇到 TLS/403/405，故不能宣称所有链接均通过本机 HTTP 200 检测。本记录是代理来源核验，不冒称团队成员已完成人工签核。

## 首批 10 条

| 事件 / 证据 | 原始来源 | 定位 | 核验事实与边界 |
| --- | --- | --- | --- |
| EVT_001 / EVD_001 | [广东印发低空经济高质量发展行动方案](https://www.gd.gov.cn/gkmlpt/content/4/4427/post_4427812.html) | 行动方案/三、适度超前布局低空基础设施 | 行动方案提出低空基础设施布局任务，属于政策部署。 不得把规划规模、起降场目标或补贴政策直接计为公司收入。 |
| EVT_002 / EVD_002 | [亿航宣布EH216-S获得型号合格证](https://www.ehang.com/cn/news/989.html) | 正文首段/中国广州，2023年10月13日 | 公司公告其EH216-S取得TC，核验范围为型号审定进展。 TC不能证明任意区域已获准收费运营，也不能证明盈利。 |
| EVT_003 / EVD_003 | [工信部披露2023年电芯及电池级锂盐价格下降](https://wap.miit.gov.cn/jgsj/dzs/gzdt/art/2024/art_876c25b352954361b270d35ebf0731fb.html) | 正文末段/全年锂电池行业产品价格出现明显下降 | 全国行业统计显示2023年电芯和锂盐价格下降，非航空级电池报价。 不能将行业降幅直接套用为某公司航空电池成本降幅或利润变化。 |
| EVT_004 / EVD_004 | [亿航披露文成30架EH216-S采购协议](https://www.ehang.com/news/1099.html) | 正文首段/has signed a purchase agreement | 文成交发签订30架采购协议；另270架属于计划，不能合并计为确定订单。 不能将270架计划当作已签订单或将30架协议额直接当作已确认收入。 |
| EVT_005 / EVD_005 | [美团无人机配送航线落地八达岭长城](https://www.meituan.com/news/NN24081904700952X) | 正文第二段/为提升景区游览体验 | 运营方披露八达岭景区无人机配送航线已开通。 单条航线不能证明全域空域开放或物流业务已盈利。 |
| EVT_006 / EVD_006 | [上海印发低空经济产业行动方案](https://www.shanghai.gov.cn/nw12344/20240816/da714ee861614ef2abae9a2b7ca317b6.html) | 二、重点任务/（一）领军企业培育行动/1.培育电动垂直起降航空器领军企业 | 方案明确以eVTOL领军企业培育带动电机、电控等配套发展。 不能仅凭政策判断所有汽车电机企业都获得航空订单。 |
| EVT_007 / EVD_007 | [民航中南局颁发EH216-S生产许可证](https://www.caac.gov.cn/local/ZNGLJ/ZN_DQYW/202404/t20240416_223537.html) | 正文第四段/PC审查组经过密集的质量体系文件评 | 监管机关确认EH216-S生产许可证颁发，证号PC0076A-ZN。 不得把PC当作运营许可或将4月公告日期误记为监管颁证日期。 |
| EVT_008 / EVD_008 | [工信部披露2024年电池级碳酸锂均价9万元每吨](https://www.miit.gov.cn/gyhxxhb/jgsj/dzxxs/dzjc/art/2025/art_b6fabc541b094897b3f27eea54981762.html) | 正文最后一段/二阶材料环节 | 2024年电池级碳酸锂年度均价9.0万元每吨，可与2023年同口径25.8万元每吨对照。 不得将锂盐年度均价、电芯售价和航空电池采购价混为同一指标。 |
| EVT_009 / EVD_009 | [亿航与英搏尔签订电机电控技术合作](https://www.ehang.com/news/1133.html) | 正文首段/Enpower，SZ300681及to co-develop | 双方披露联合开发eVTOL电机和电控的战略合作。 战略合作不证明已量产供货或存在确定收入规模。 |
| EVT_010 / EVD_010 | [EH216-S在文成完成载人首飞](https://www.ehang.com/news/1101.html) | 正文第二段/On June 22 | 6月22日在文成完成载人首飞，支持文旅示范事实；不证明收费常态运营。 不得从首飞推定已取得OC、持续收费收入或盈利。 |

## 固定随机抽查 10 条

使用 Python 标准库 `random.Random(4).sample(event_ids, 10)`，排序后为 `EVT_001, EVT_003, EVT_004, EVT_005, EVT_008, EVT_010, EVT_013, EVT_016, EVT_023, EVT_024`。与首批记录可能重叠，抽样范围为全部 30 条；不为凑不重叠而改种子。

| 事件 | 原始来源 | 复核定位 | 结论 |
| --- | --- | --- | --- |
| EVT_001 | [广东印发低空经济高质量发展行动方案](https://www.gd.gov.cn/gkmlpt/content/4/4427/post_4427812.html) | 行动方案/三、适度超前布局低空基础设施 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_003 | [工信部披露2023年电芯及电池级锂盐价格下降](https://wap.miit.gov.cn/jgsj/dzs/gzdt/art/2024/art_876c25b352954361b270d35ebf0731fb.html) | 正文末段/全年锂电池行业产品价格出现明显下降 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_004 | [亿航披露文成30架EH216-S采购协议](https://www.ehang.com/news/1099.html) | 正文首段/has signed a purchase agreement | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_005 | [美团无人机配送航线落地八达岭长城](https://www.meituan.com/news/NN24081904700952X) | 正文第二段/为提升景区游览体验 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_008 | [工信部披露2024年电池级碳酸锂均价9万元每吨](https://www.miit.gov.cn/gyhxxhb/jgsj/dzxxs/dzjc/art/2025/art_b6fabc541b094897b3f27eea54981762.html) | 正文最后一段/二阶材料环节 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_010 | [EH216-S在文成完成载人首飞](https://www.ehang.com/news/1101.html) | 正文第二段/On June 22 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_013 | [深圳公布低空经济产业促进条例](https://www.szrd.gov.cn/v2/zx/szfg/content/post_1123253.html) | 第二章 基础设施/第十二条 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_016 | [四川印发促进低空经济发展的指导意见](https://ybsgxq.sczwfw.gov.cn/art/2024/6/24/art_63297_262202.html) | 三、保障措施/（三）强化资金支持 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_023 | [民航中南局披露EH216-S型号审查及运行准备进展](https://zn.caac.gov.cn/ZN_DQYW/202308/t20230831_221215.html) | 正文第二段/项目审查组按照型号合格审定程序 | 原始正文支持所记录事实；财务/路径影响未核验 |
| EVT_024 | [EH216-S两家运营商取得首批载人无人机运营合格证](https://www.ehang.com/cn/news/1195.html) | 正文首段/3月28日，广东亿航通用航空有限公司 | 原始正文支持所记录事实；财务/路径影响未核验 |

## 全部来源清单

| 事件 | 来源等级 | 事件日期 | 来源发布日期 | 原始来源 |
| --- | --- | --- | --- | --- |
| EVT_001 | A | 2024-05-21 | 2024-05-22 | [广东印发低空经济高质量发展行动方案](https://www.gd.gov.cn/gkmlpt/content/4/4427/post_4427812.html) |
| EVT_002 | B | 2023-10-13 | 2023-10-13 | [亿航宣布EH216-S获得型号合格证](https://www.ehang.com/cn/news/989.html) |
| EVT_003 | A | 2023-12-31 | 2024-03-01 | [工信部披露2023年电芯及电池级锂盐价格下降](https://wap.miit.gov.cn/jgsj/dzs/gzdt/art/2024/art_876c25b352954361b270d35ebf0731fb.html) |
| EVT_004 | B | 2024-06-21 | 2024-06-21 | [亿航披露文成30架EH216-S采购协议](https://www.ehang.com/news/1099.html) |
| EVT_005 | B | 2024-08-16 | 2024-08-16 | [美团无人机配送航线落地八达岭长城](https://www.meituan.com/news/NN24081904700952X) |
| EVT_006 | A | 2024-07-25 | 2024-08-16 | [上海印发低空经济产业行动方案](https://www.shanghai.gov.cn/nw12344/20240816/da714ee861614ef2abae9a2b7ca317b6.html) |
| EVT_007 | A | 2024-03-28 | 2024-04-16 | [民航中南局颁发EH216-S生产许可证](https://www.caac.gov.cn/local/ZNGLJ/ZN_DQYW/202404/t20240416_223537.html) |
| EVT_008 | A | 2024-12-31 | 2025-02-27 | [工信部披露2024年电池级碳酸锂均价9万元每吨](https://www.miit.gov.cn/gyhxxhb/jgsj/dzxxs/dzjc/art/2025/art_b6fabc541b094897b3f27eea54981762.html) |
| EVT_009 | B | 2024-11-11 | 2024-11-11 | [亿航与英搏尔签订电机电控技术合作](https://www.ehang.com/news/1133.html) |
| EVT_010 | B | 2024-06-22 | 2024-06-25 | [EH216-S在文成完成载人首飞](https://www.ehang.com/news/1101.html) |
| EVT_011 | A | 2024-03-27 | 2024-03-27 | [四部门印发通用航空装备创新应用实施方案](https://www.miit.gov.cn/jgsj/zbes/wjfb/art/2024/art_eea7f1d8dd25444bb370faaaf26637d6.html) |
| EVT_012 | A | 2024-04-01 | 2024-04-24 | [安徽印发低空经济实施方案及若干措施](https://www.ahlx.gov.cn/OpennessContent/show/3385063.html) |
| EVT_013 | A | 2024-01-03 | 2024-01-03 | [深圳公布低空经济产业促进条例](https://www.szrd.gov.cn/v2/zx/szfg/content/post_1123253.html) |
| EVT_014 | A | 2024-08-12 | 2024-09-04 | [江苏印发低空经济高质量发展实施意见](https://www.js.gov.cn/art/2024/9/4/art_87051_11403265.html) |
| EVT_015 | A | 2024-05-29 | 2024-05-31 | [广州印发低空经济发展实施方案](https://www.gz.gov.cn/gzzcwjk/gzdata/content/post_9681691.html) |
| EVT_016 | A | 2024-06-03 | 2024-06-24 | [四川印发促进低空经济发展的指导意见](https://ybsgxq.sczwfw.gov.cn/art/2024/6/24/art_63297_262202.html) |
| EVT_017 | B | 2024-07-01 | 2024-07-01 | [亿航与南航通航披露战略合作备忘录](https://www.ehang.com/news/1102.html) |
| EVT_018 | B | 2024-07-19 | 2024-07-19 | [亿航与KC Smart Mobility签订采购及运营合作](https://www.ehang.com/news/1108.html) |
| EVT_019 | B | 2024-11-15 | 2024-11-15 | [亿航与祥源文旅签订框架合作并披露首批5架订单](https://www.ehang.com/news/1140.html) |
| EVT_020 | B | 2024-12-21 | 2024-12-21 | [亿航与长安汽车披露飞行汽车战略合作](https://www.ehang.com/news/1162.html) |
| EVT_021 | B | 2024-12-27 | 2024-12-27 | [亿航与中交信科披露低空基础设施合作](https://www.ehang.com/news/1168.html) |
| EVT_022 | B | 2025-02-25 | 2025-02-25 | [亿航江淮汽车国先控股披露eVTOL制造基地框架合作](https://www.ehang.com/news/1187.html) |
| EVT_023 | A | 2023-08-31 | 2023-08-31 | [民航中南局披露EH216-S型号审查及运行准备进展](https://zn.caac.gov.cn/ZN_DQYW/202308/t20230831_221215.html) |
| EVT_024 | B | 2025-03-28 | 2025-03-30 | [EH216-S两家运营商取得首批载人无人机运营合格证](https://www.ehang.com/cn/news/1195.html) |
| EVT_025 | B | 2024-06-06 | 2024-06-07 | [内蒙古光威一期碳纤维项目投产](https://gwcfc.com/news/show-237.aspx) |
| EVT_026 | A | 2023-12-13 | 2023-12-15 | [中复神鹰披露国产T300及T700碳纤维价格回落](https://dataclouds.cninfo.com.cn/shgonggao/2023/2023-12-15/43bf3b0e9aec11eeb59dfa163e39923a.pdf) |
| EVT_027 | A | 2024-04-08 | 2024-04-08 | [深圳龙华生态执法披露无人机常态巡查应用](https://meeb.sz.gov.cn/ztfw/ztzl/zfdlbzl/2024/szlb/content/post_11233613.html) |
| EVT_028 | A | 2024-07-08 | 2024-07-12 | [应急管理部披露无人机参与华容团洲垸决口处置](https://www.mem.gov.cn/xw/xwfbh/2024n07y12xwfbh_6136/wzsl_4260/202407/t20240712_494592.shtml) |
| EVT_029 | B | 2024-11-13 | 2024-11-13 | [亿航宣布合肥骆岗UAM枢纽启用](https://www.ehang.com/news/1135.html) |
| EVT_030 | B | 2025-01-21 | 2025-01-21 | [深圳罗湖UAM体验中心启用并完成首飞示范](https://www.ehang.com/news/1183.html) |

## 结构检查与集成边界

离线校验命令与判定规则见 [证据标准](EVIDENCE_STANDARD.md)。自动校验仅检查结构、配额、外键及日期，不自动证明外部页面的语义、可用性或图谱路径。

所有案例的传导路径均标为 `hypothesis_pending_graph_validation`。主分支尚无正式图谱字典，节点使用独立命名空间 `NODE_EVID_`，待图谱负责人对齐。团队成员人工签核为 `pending`，首批 10 条须由审阅人再次打开 URL、核对 location 后更新 `data/evidence_review.json`。

