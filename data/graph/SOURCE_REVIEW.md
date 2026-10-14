# 图谱来源逐条核查（2026-10-15）

已阅读全文或明确段落的25份一手资料及补充文档，逐条登记35个节点、50条关系和10条规则。35个节点与42条关系的定义/技术连接有直接资料；8条连接及10条完整经济传导规则保留待核验。

## 核验范围

- 节点的 `verified` 只证明其技术、产品或场景定义有来源，不证明所有机型采用它。钛合金的航空材料定义有研究依据，通航/eVTOL具体采用关系仍待核验。
- 关系的 `verified` 核验的是成立条件下的技术连接、应用用途或明确规划能力；`effect_direction=positive` 表示功能支持路径，不能据此认定证券、需求、利润会同方向变化。经济影响须由事件规则另行核验。
- 使用正式规划、研发方案或试飞资料的连接，条件明确限定为规划建设完成后、研发能力或试验阶段；不把目标当作已部署或已获证事实。
- 年报签署日期明确登记为 `report_signature`，不使用财年截止日充当发布日期；网页日期以正文为准，不从URL目录猜测。无发布日期的PX4文档仅为补充阅读，不用于恢复核验状态。
- 外国技术实例只说明具体设计和技术用途，不等于A股公司供应链、业务暴露或中国运行许可。
- `source_review.json` 保存可机器校验的日期、定位、判断和逐条记录；不保存受限报告全文。

## 逐条记录

### 节点定义

| 记录 | 状态 | 来源与定位 | 核查判断 |
|---|---|---|---|
| 碳纤维<br>`NODE_CARBON_FIBER` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>供应协议正文第1–5段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 复合材料<br>`NODE_COMPOSITE` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>供应协议正文第1–5段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 铝合金<br>`NODE_ALUMINUM_ALLOY` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页46：航空器材料构成 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 钛合金<br>`NODE_TITANIUM_ALLOY` | 已核验 | [NASA](https://ntrs.nasa.gov/citations/19930016859)<br>1993-04-01<br>摘要：钛合金航空结构研究 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 航空结构胶<br>`NODE_AEROSPACE_ADHESIVE` | 已核验 | [Henkel](https://www.henkel.com/spotlight/innovation/2025-09-17-light-strong-sustainable-why-modern-aircraft-cant-take-off-without-adhesives-2087436)<br>2025-09-17<br>From the largest wing to the smallest wire | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 动力电池<br>`NODE_POWER_BATTERY` | 已核验 | [EHang / SEC](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b)<br>2026-05-15<br>PDF第32页（印刷页28）：锂离子电池包 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 电池管理系统 BMS<br>`NODE_BMS` | 已核验 | [Texas Instruments](https://www.ti.com/about-ti/newsroom/news-releases/2017/2017-01-17-ti-technology-extends-flight-time-and-battery-life-of-quadcopters-and-industrial-drones.html)<br>2017-01-17<br>Breakthrough battery management design | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 电池包<br>`NODE_BATTERY_PACK` | 已核验 | [Texas Instruments](https://www.ti.com/about-ti/newsroom/news-releases/2017/2017-01-17-ti-technology-extends-flight-time-and-battery-life-of-quadcopters-and-industrial-drones.html)<br>2017-01-17<br>Breakthrough battery management design | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 电机<br>`NODE_MOTOR` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>The Joby Aviation eVTOL aircraft 图注 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 电控<br>`NODE_MOTOR_CONTROLLER` | 已核验 | [Texas Instruments](https://www.ti.com/about-ti/newsroom/news-releases/2017/2017-01-17-ti-technology-extends-flight-time-and-battery-life-of-quadcopters-and-industrial-drones.html)<br>2017-01-17<br>High-speed performance for efficient motors | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 氢燃料电池<br>`NODE_HYDROGEN_FUEL_CELL` | 已核验 | [ZeroAvia](https://zeroavia.com/do228-first-flight/)<br>2023-01-19<br>试验动力配置及Piper Malibu回顾段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 芯片<br>`NODE_CHIP` | 已核验 | [STMicroelectronics](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/)<br>2017-11-30<br>How to Help Developers? | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 传感器<br>`NODE_SENSOR` | 已核验 | [STMicroelectronics](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/)<br>2017-11-30<br>Why Use ST MEMS to Fly a Drone? | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 激光雷达/毫米波雷达<br>`NODE_LIDAR_RADAR` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：飞控系统传感器（毫米波雷达） | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 光学相机<br>`NODE_OPTICAL_CAMERA` | 已核验 | [DJI](https://www.dji.com/ch/newsroom/news/announcing-the-dji-inspire-1)<br>2014-11-13<br>Main Features / 4K Camera | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 飞控<br>`NODE_FLIGHT_CONTROL` | 已核验 | [STMicroelectronics](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/)<br>2017-11-30<br>开发板介绍与传感器章节 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 导航定位<br>`NODE_NAVIGATION` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：飞控系统GNSS接收机 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 通信模块<br>`NODE_COMMUNICATION_MODULE` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：通信系统LTE收发模块 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 消费级无人机<br>`NODE_CONSUMER_DRONE` | 已核验 | [DJI](https://www.dji.com/ch/newsroom/news/announcing-the-dji-inspire-1)<br>2014-11-13<br>产品介绍与Main Features | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 工业无人机<br>`NODE_INDUSTRIAL_DRONE` | 已核验 | [DJI Enterprise](https://enterprise-insights.dji.com/blog/matrice-350-top-8-features)<br>2023-05-18<br>产品介绍与功能1–8 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 固定翼无人机<br>`NODE_FIXED_WING_DRONE` | 已核验 | [湖南省工业和信息化厅](https://gxt.hunan.gov.cn/gxt/xxgk_71033/gzdt/qyzx/202107/t20210719_19948256.html)<br>2021-07-19<br>机型介绍第2–4段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| eVTOL<br>`NODE_EVTOL` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>Joby eVTOL机型与六电机图注 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 通航飞机<br>`NODE_GENERAL_AVIATION_AIRCRAFT` | 已核验 | [中国民航局](https://app.caac.gov.cn/PHONE/XWZX/MHYW/202207/t20220726_214744.html)<br>2022-07-26<br>民用多用途直升机及用途段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 起降场<br>`NODE_VERTIPORT` | 已核验 | [FAA](https://www.faa.gov/newsroom/faa-releases-vertiport-design-standards-support-safe-integration-advanced-air-mobility)<br>2022-09-26<br>设计要素：Safety-critical geometry | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 充换电<br>`NODE_CHARGING_SWAP` | 已核验 | [FAA](https://www.faa.gov/newsroom/faa-releases-vertiport-design-standards-support-safe-integration-advanced-air-mobility)<br>2022-09-26<br>Charging and electric infrastructure | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 低空通信网络<br>`NODE_LOW_ALTITUDE_NETWORK` | 已核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）8：构建低空通信网络 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 低空监视雷达<br>`NODE_LOW_ALTITUDE_SURVEILLANCE` | 已核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）10：打造低空监视网（含雷达） | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 低空交通管理平台<br>`NODE_UTM_PLATFORM` | 已核验 | [深圳市龙华区人民政府](https://www.szlhq.gov.cn/xxgk/xwzx/gzdt/content/post_12982043.html)<br>2026-09-15<br>数字孪生平台与飞行计划闭环管理段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 气象服务<br>`NODE_WEATHER_SERVICE` | 已核验 | [中国气象局](https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202502/t20250214_6852409.html)<br>2025-02-14<br>气象要素观测需求及服务保障试点段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 低空数字孪生/智联网<br>`NODE_DIGITAL_TWIN` | 已核验 | [深圳市龙华区人民政府](https://www.szlhq.gov.cn/xxgk/xwzx/gzdt/content/post_12982043.html)<br>2026-09-15<br>数字孪生平台对接运营主体数据段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 低空物流<br>`NODE_LOW_ALTITUDE_LOGISTICS` | 已核验 | [湖南省交通运输厅](https://jtt.hunan.gov.cn/jtt/xxgk/gzdt/szdt1/202408/t20240823_33437155.html)<br>2024-08-15<br>5条航线与无人机物资配送案例 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 农林植保<br>`NODE_AGRICULTURAL_PROTECTION` | 已核验 | [DJI Agriculture](https://ag.dji.com/newsroom/agras-t50-and-t25-global-launch)<br>2024-04-26<br>Better Growth with the Agras T50 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 电力巡检<br>`NODE_POWER_INSPECTION` | 已核验 | [JOUAV](https://www.jouav.com/news/next-gen-vtol-hangar-unveiled.html)<br>2024-04-25<br>系统介绍与Fully Automated Power Line Inspection | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 应急救援<br>`NODE_EMERGENCY_RESCUE` | 已核验 | [中国民航局](https://app.caac.gov.cn/PHONE/XWZX/MHYW/202207/t20220726_214744.html)<br>2022-07-26<br>搜索救援、医疗救护及应急救援用途段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |
| 文旅观光<br>`NODE_AERIAL_TOURISM` | 已核验 | [民航东北地区管理局](https://db.caac.gov.cn/DB_XXGK/DB_GZDT/202410/t20241016_225618.html)<br>2024-10-10<br>九龙口景区直升机空中游览检查段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`node_definition` |

### 技术和应用关系

| 记录 | 状态 | 来源与定位 | 核查判断 |
|---|---|---|---|
| 碳纤维 → 复合材料<br>`REL_CARBON_COMPOSITE` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>供应协议正文：碳纤维复材体系 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 复合材料 → eVTOL<br>`REL_COMPOSITE_EVTOL` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>供应协议正文：Joby材料供应及机体用途 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 动力电池 → eVTOL<br>`REL_BATTERY_EVTOL` | 已核验 | [EHang / SEC](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b)<br>2026-05-15<br>PDF第32页（印刷页28）：机载锂离子电池包 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 电机 → 电控<br>`REL_MOTOR_CONTROLLER` | 已核验 | [Texas Instruments](https://www.ti.com/about-ti/newsroom/news-releases/2017/2017-01-17-ti-technology-extends-flight-time-and-battery-life-of-quadcopters-and-industrial-drones.html)<br>2017-01-17<br>High-speed performance for efficient motors | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 电控 → eVTOL<br>`REL_CONTROLLER_EVTOL` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页51：自制电子调速器与航空器总装 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 芯片 → 飞控<br>`REL_CHIP_FLIGHT_CONTROL` | 已核验 | [STMicroelectronics](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/)<br>2017-11-30<br>How to Help Developers? / STM32F401CC | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 传感器 → 飞控<br>`REL_SENSOR_FLIGHT_CONTROL` | 已核验 | [STMicroelectronics](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/)<br>2017-11-30<br>Why Use ST MEMS to Fly a Drone? | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 激光雷达/毫米波雷达 → 飞控<br>`REL_RADAR_FLIGHT_CONTROL` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：毫米波雷达输入飞控 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 飞控 → 工业无人机<br>`REL_FLIGHT_CONTROL_INDUSTRIAL_DRONE` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页47–48：全机型飞控与自动驾驶 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 导航定位 → 低空通信网络<br>`REL_NAV_NETWORK` | 待核验 | [中国民航局](https://www.caac.gov.cn/XWZX/MHYW/201704/t20170421_43752.html)<br>2017-04-18<br>北斗定位与低空监视框架段 | 可支持导航/监视体系，但不能直接证明导航定位服务向纯低空通信网络供给的连接。<br>范围：`technical_connection` |
| 通信模块 → 低空通信网络<br>`REL_COMM_NETWORK` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：LTE模块与高速无线网络 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 起降场 → 低空物流<br>`REL_VERTIPORT_LOGISTICS` | 已核验 | [深圳市龙华区人民政府](https://www.szlhq.gov.cn/xxgk/xwzx/gzdt/content/post_12982043.html)<br>2026-09-15<br>47处物流起降点和物流集散中心段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 低空数字孪生/智联网 → 低空物流<br>`REL_DIGITAL_TWIN_LOGISTICS` | 已核验 | [深圳市龙华区人民政府](https://www.szlhq.gov.cn/xxgk/xwzx/gzdt/content/post_12982043.html)<br>2026-09-15<br>数字孪生平台对接美团、丰翼运行数据段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 工业无人机 → 电力巡检<br>`REL_INDUSTRIAL_DRONE_INSPECTION` | 已核验 | [JOUAV](https://www.jouav.com/news/next-gen-vtol-hangar-unveiled.html)<br>2024-04-25<br>CW-15V无人机电力巡检系统段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 工业无人机 → 应急救援<br>`REL_INDUSTRIAL_DRONE_RESCUE` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页49：应急响应与救灾 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 消费级无人机 → 文旅观光<br>`REL_CONSUMER_DRONE_TOURISM` | 待核验 | [中国民航局](https://www.caac.gov.cn/XWZX/MHYW/202501/t20250103_226313.html)<br>2025-01-03<br>消费娱乐、影视航拍与空中游览应用段 | 分别列出航拍和游览，未直接证明消费级无人机提供此条文旅观光服务。<br>范围：`technical_connection` |
| 铝合金 → 固定翼无人机<br>`REL_ALUMINUM_FIXED_WING` | 待核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页46：航空器材料构成 | 航空铝合金用于AAV机体，但未明确固定翼无人机机型；不能跨机型外推。<br>范围：`technical_connection` |
| 钛合金 → 通航飞机<br>`REL_TITANIUM_GENERAL_AVIATION` | 待核验 | [NASA](https://ntrs.nasa.gov/citations/19930016859)<br>1993-04-01<br>摘要：航空钛合金结构研究 | 仅有航空材料背景，未定位通用航空具体机型或供应关系。<br>范围：`technical_connection` |
| 航空结构胶 → 复合材料<br>`REL_ADHESIVE_COMPOSITE` | 已核验 | [Henkel](https://www.henkel.com/spotlight/innovation/2025-09-17-light-strong-sustainable-why-modern-aircraft-cant-take-off-without-adhesives-2087436)<br>2025-09-17<br>From the largest wing to the smallest wire | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 碳纤维 → 消费级无人机<br>`REL_CARBON_CONSUMER_DRONE` | 已核验 | [DJI](https://www.dji.com/ch/newsroom/news/announcing-the-dji-inspire-1)<br>2014-11-13<br>Main Features / Transforming Design | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 复合材料 → 工业无人机<br>`REL_COMPOSITE_INDUSTRIAL_DRONE` | 已核验 | [湖南省工业和信息化厅](https://gxt.hunan.gov.cn/gxt/xxgk_71033/gzdt/qyzx/202107/t20210719_19948256.html)<br>2021-07-19<br>全复材基础机体与任务用途段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 铝合金 → eVTOL<br>`REL_ALUMINUM_EVTOL` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页46：材料构成与载人电动机型 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 钛合金 → eVTOL<br>`REL_TITANIUM_EVTOL` | 待核验 | [NASA](https://ntrs.nasa.gov/citations/19930016859)<br>1993-04-01<br>摘要：航空钛合金结构研究 | 未定位eVTOL具体机型承力部件采用钛合金的直接原文。<br>范围：`technical_connection` |
| 航空结构胶 → eVTOL<br>`REL_ADHESIVE_EVTOL` | 已核验 | [Henkel](https://www.henkel.com/spotlight/2025-10-08-enabling-the-future-of-flight-with-henkel-adhesive-technologies-2090576)<br>2025-10-08<br>结构粘接解决方案与开发合作段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`development_capability` |
| 电池管理系统 BMS → 电池包<br>`REL_BMS_BATTERY_PACK` | 已核验 | [Texas Instruments](https://www.ti.com/about-ti/newsroom/news-releases/2017/2017-01-17-ti-technology-extends-flight-time-and-battery-life-of-quadcopters-and-industrial-drones.html)<br>2017-01-17<br>Breakthrough battery management design | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 电池包 → eVTOL<br>`REL_BATTERY_PACK_EVTOL` | 已核验 | [EHang / SEC](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b)<br>2026-05-15<br>PDF第32页（印刷页28）：机载电池包 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 氢燃料电池 → 通航飞机<br>`REL_HYDROGEN_GENERAL_AVIATION` | 已核验 | [ZeroAvia](https://zeroavia.com/do228-first-flight/)<br>2023-01-19<br>Piper Malibu六座氢电试验机回顾段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`flight_test_connection` |
| 电机 → eVTOL<br>`REL_MOTOR_EVTOL` | 已核验 | [Toray Advanced Composites](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement)<br>2020-12-08<br>Joby eVTOL 六电机图注 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 芯片 → eVTOL<br>`REL_CHIP_EVTOL` | 已核验 | [EHang / SEC](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b)<br>2026-05-15<br>PDF第32页（印刷页28）：外购芯片用于航空器组装 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 光学相机 → 飞控<br>`REL_OPTICAL_FLIGHT_CONTROL` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：视觉传感器数据用于飞控决策 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 飞控 → 消费级无人机<br>`REL_FLIGHT_CONTROL_CONSUMER_DRONE` | 已核验 | [STMicroelectronics](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/)<br>2017-11-30<br>玩具无人机飞控开发板介绍 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 导航定位 → 工业无人机<br>`REL_NAV_INDUSTRIAL_DRONE` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：GNSS及导航决策 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 通信模块 → 工业无人机<br>`REL_COMM_INDUSTRIAL_DRONE` | 已核验 | [DJI Enterprise](https://enterprise-insights.dji.com/blog/matrice-350-top-8-features)<br>2023-05-18<br>3. Transmission System | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 激光雷达/毫米波雷达 → eVTOL<br>`REL_RADAR_EVTOL` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：毫米波雷达与避障决策 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| eVTOL → 起降场<br>`REL_EVTOL_VERTIPORT` | 已核验 | [FAA](https://www.faa.gov/newsroom/faa-releases-vertiport-design-standards-support-safe-integration-advanced-air-mobility)<br>2022-09-26<br>起降场设计要素与AAM用途 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| eVTOL → 充换电<br>`REL_EVTOL_CHARGING` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：载人航空器充电设备 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 工业无人机 → 低空通信网络<br>`REL_INDUSTRIAL_NETWORK` | 已核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：机载LTE通信与地面网络 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 固定翼无人机 → 低空监视雷达<br>`REL_FIXED_WING_SURVEILLANCE` | 待核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）10：低空监视网规划 | 规划涵盖无人机监视，未定位固定翼机型及雷达实际监视案例。<br>范围：`technical_connection` |
| 通航飞机 → 低空交通管理平台<br>`REL_GENERAL_UTM` | 已核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）7：低空飞行计划处理及协调 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`planned_capability` |
| eVTOL → 低空数字孪生/智联网<br>`REL_EVTOL_DIGITAL_TWIN` | 待核验 | [EHang / SEC](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm)<br>2020-04-20<br>印刷页48：地面指挥控制系统 | 指挥控制数据链不自动等于数字孪生或城市智联网；缺少明确接入资料。<br>范围：`technical_connection` |
| 低空通信网络 → 低空交通管理平台<br>`REL_NETWORK_UTM` | 已核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）7–8：SILAS及通信网络服务保障 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`planned_capability` |
| 低空交通管理平台 → 低空物流<br>`REL_UTM_LOGISTICS` | 已核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）7：载货无人机数字化管理能力 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`planned_capability` |
| 气象服务 → 应急救援<br>`REL_WEATHER_EMERGENCY` | 已核验 | [中国气象局](https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202502/t20250214_6852409.html)<br>2025-02-14<br>面向应急救援场景的气象保障试点段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`planned_capability` |
| 低空监视雷达 → 电力巡检<br>`REL_SURVEILLANCE_INSPECTION` | 待核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）10：低空监视网规划 | 空域监视设施不同于机载巡检载荷，未证明该雷达对电力巡检任务的具体支持关系。<br>范围：`technical_connection` |
| 起降场 → 文旅观光<br>`REL_VERTIPORT_TOURISM` | 已核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（一）2：起降场满足观光旅游需求 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`planned_capability` |
| 充换电 → 农林植保<br>`REL_CHARGING_AGRICULTURE` | 已核验 | [DJI Agriculture](https://ag.dji.com/newsroom/agras-t50-and-t25-global-launch)<br>2024-04-26<br>9-Minute Fast Charging | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 工业无人机 → 农林植保<br>`REL_INDUSTRIAL_AGRICULTURE` | 已核验 | [DJI Agriculture](https://ag.dji.com/newsroom/agras-t50-and-t25-global-launch)<br>2024-04-26<br>喷洒/播撒与农业应用章节 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 固定翼无人机 → 低空物流<br>`REL_FIXED_LOGISTICS` | 已核验 | [湖南省工业和信息化厅](https://gxt.hunan.gov.cn/gxt/xxgk_71033/gzdt/qyzx/202107/t20210719_19948256.html)<br>2021-07-19<br>独立储货空间与物资输送用途段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 通航飞机 → 应急救援<br>`REL_GENERAL_RESCUE` | 已核验 | [中国民航局](https://app.caac.gov.cn/PHONE/XWZX/MHYW/202207/t20220726_214744.html)<br>2022-07-26<br>搜索救援、医疗救护用途段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |
| 通航飞机 → 文旅观光<br>`REL_GENERAL_TOURISM` | 已核验 | [民航东北地区管理局](https://db.caac.gov.cn/DB_XXGK/DB_GZDT/202410/t20241016_225618.html)<br>2024-10-10<br>景区直升机空中游览运行检查段 | 原文直接支持节点或技术/应用连接，适用范围以具体案例和成立条件为限。<br>范围：`technical_connection` |

### 事件规则

| 记录 | 状态 | 来源与定位 | 核查判断 |
|---|---|---|---|
| 原材料价格上涨<br>`RULE_CARBON_FIBER_PRICE_UP_V1` | 待核验 | [EHang / SEC](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b)<br>2026-05-15<br>PDF第32页（印刷页28）：供应及价格风险 | 原文支持一般原材料/部件价格风险，未证明碳纤维涨价沿该路径的实际幅度和负向结果。<br>范围：`economic_transmission_hypothesis` |
| 关键零部件价格下降<br>`RULE_BATTERY_PRICE_DOWN_V1` | 待核验 | [EHang / SEC](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b)<br>2026-05-15<br>PDF第32页（印刷页28）：电池采购与供应风险 | 电池应用和价格风险有依据，但降价是否转化为物流需求/利润仍需实际采购价、成本和运营证据。<br>范围：`economic_transmission_hypothesis` |
| 适航进展<br>`RULE_AIRWORTHINESS_PROGRESS_V1` | 待核验 | [中国民航局](https://www.caac.gov.cn/XXGK/XXGK/BZGF/ZYTJHHM/202202/t20220222_211914.html)<br>2022-02-09<br>EH216-S型号专用条件及附件 | 支持型号适航要求，不证明型号进展使起降场和物流运营自动获批或受益。<br>范围：`economic_transmission_hypothesis` |
| 政策补贴<br>`RULE_SUBSIDY_POLICY_V1` | 待核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（一）2与二（二）7：起降设施及服务平台规划 | 这是建设规划，未规定本规则假设的eVTOL购置/运营及充电补贴，仍需具体补贴文件。<br>范围：`economic_transmission_hypothesis` |
| 空域开放<br>`RULE_AIRSPACE_OPENING_V1` | 待核验 | [深圳市发展和改革委员会](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html)<br>2025-07-31<br>二（二）7：飞行计划协调与载货无人机管理 | 具备空域协调目标不等于航线开放或经营许可，尚需具体空域批复与物流运营数据。<br>范围：`economic_transmission_hypothesis` |
| 订单合作<br>`RULE_UAV_ORDER_V1` | 待核验 | [JOUAV](https://www.jouav.com/news/next-gen-vtol-hangar-unveiled.html)<br>2024-04-25<br>CW-15V电力巡检系统介绍 | 支持产品与场景匹配，不是已签订单、履约验收或新增收入证据。<br>范围：`economic_transmission_hypothesis` |
| 运营场景落地<br>`RULE_AGRICULTURAL_OPERATION_V1` | 待核验 | [DJI Agriculture](https://ag.dji.com/newsroom/agras-t50-and-t25-global-launch)<br>2024-04-26<br>植保用途、喷洒/播撒及续航保障章节 | 支持植保应用能力，不能量化季节性运营落地对需求和利润的作用。<br>范围：`economic_transmission_hypothesis` |
| 基础设施建设<br>`RULE_DIGITAL_TWIN_DEPLOYMENT_V1` | 待核验 | [深圳市龙华区人民政府](https://www.szlhq.gov.cn/xxgk/xwzx/gzdt/content/post_12982043.html)<br>2026-09-15<br>数字孪生平台接入物流运行主体数据段 | 支持具体平台接入案例；普遍的部署利好方向和财务效果仍属于分析假设。<br>范围：`economic_transmission_hypothesis` |
| 极端气象<br>`RULE_WEATHER_ALERT_V1` | 待核验 | [中国气象局](https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202502/t20250214_6852409.html)<br>2025-02-14<br>气象要素需求与应急救援服务保障段 | 说明气象保障需求，不足以判定一次极端天气对救援需求及可飞性的净影响。<br>范围：`economic_transmission_hypothesis` |
| 动力技术突破<br>`RULE_HYDROGEN_TECH_V1` | 待核验 | [ZeroAvia](https://zeroavia.com/do228-first-flight/)<br>2023-01-19<br>氢电试飞配置与Piper Malibu回顾段 | 支持技术试飞，不代表获证、应急场景落地或商业收入。<br>范围：`economic_transmission_hypothesis` |

## 来源索引

| 来源 | 日期口径 | 可支持的内容 |
|---|---|---|
| [Toray Advanced Composites and Joby Aviation Finalize a Long-Term Supply Agreement](https://www.toraytac.com/newsroom/news-item/2020/12/8/Toray-Advanced-Composites-and-Joby-Aviation-Finalize-a-Long_Term-Supply-Agreement) | 2020-12-08 / `page_publication` | Joby采用东丽碳纤维复材；页面亦介绍其电动垂直起降机型及六台电机。 |
| [Why modern airplanes can’t take off without adhesives](https://www.henkel.com/spotlight/innovation/2025-09-17-light-strong-sustainable-why-modern-aircraft-cant-take-off-without-adhesives-2087436) | 2025-09-17 / `page_publication` | 说明航空结构胶与复合材料连接、结构粘接及复材维修用途。 |
| [Enabling the Future of Flight with Henkel Adhesive Technologies](https://www.henkel.com/spotlight/2025-10-08-enabling-the-future-of-flight-with-henkel-adhesive-technologies-2090576) | 2025-10-08 / `page_publication` | 提供eVTOL结构粘接、储能和电子系统胶粘解决方案；不是某机型装机或适航证明。 |
| [TI technology extends flight time and battery life of quadcopters and industrial drones](https://www.ti.com/about-ti/newsroom/news-releases/2017/2017-01-17-ti-technology-extends-flight-time-and-battery-life-of-quadcopters-and-industrial-drones.html) | 2017-01-17 / `page_publication` | 无人机电池包BMS参考设计及电机ESC控制方案。 |
| [Build and Fly Your Own Drone with ST’s First Controller Unit](https://blog.st.com/steval-fcu001v1-drone-flight-controller-unit/) | 2017-11-30 / `page_publication` | 飞控开发板集成MCU和惯性、气压、磁传感器，可用于小型无人机。 |
| [EHang Holdings Limited 2019 Annual Report (Form 20-F)](https://www.sec.gov/Archives/edgar/data/1759783/000119312520112223/d863414d20f.htm) | 2020-04-20 / `report_signature` | 历史披露的材料构成、飞控传感器、无线通信、补能和应用案例；不代表当前所有型号配置。 |
| [EHang Holdings Limited 2025 Annual Report (Form 20-F)](https://ir.ehang.com/static-files/99f93ebc-2713-43e5-bf81-6e8be7a08c6b) | 2026-05-15 / `report_signature` | 列出电池包、电机、芯片及自制电机驱动、飞控、BMS等部件，说明供应风险。 |
| [ZeroAvia Makes Aviation History, Flying World’s Largest Aircraft Powered with a Hydrogen-Electric Engine](https://zeroavia.com/do228-first-flight/) | 2023-01-19 / `page_publication` | 氢电试飞报道也回顾Piper Malibu六座试验机；首飞不等于商业适航获证。 |
| [山河SA70U无人机成功首飞](https://gxt.hunan.gov.cn/gxt/xxgk_71033/gzdt/qyzx/202107/t20210719_19948256.html) | 2021-07-19 / `page_publication` | 固定翼无人机采用全复材基础机体，并列出物资运输、巡查等用途。 |
| [Announcing the DJI Inspire 1 Drone](https://www.dji.com/ch/newsroom/news/announcing-the-dji-inspire-1) | 2014-11-13 / `page_publication` | 碳纤维机臂、相机、光流定位、飞行系统和智能电池。 |
| [Top 8 Features of the Matrice 350 RTK](https://enterprise-insights.dji.com/blog/matrice-350-top-8-features) | 2023-05-18 / `page_publication` | 行业无人机通信、定位、FPV相机、救援用途及热插拔电池系统。 |
| [DJI Agras T50 and T25 Expand Aerial Crop Protection Capabilities](https://ag.dji.com/newsroom/agras-t50-and-t25-global-launch) | 2024-04-26 / `page_publication` | 植保喷洒/播撒、视觉雷达感知、无线连接及换电配合快充；正文活动日期为4月25日。 |
| [FAA Releases Vertiport Design Standards to Support the Safe Integration of Advanced Air Mobility Aircraft](https://www.faa.gov/newsroom/faa-releases-vertiport-design-standards-support-safe-integration-advanced-air-mobility) | 2022-09-26 / `page_publication` | 垂直起降场的起降区域、承载及电池充电保障；用于技术关系，不作为中国许可依据。 |
| [深圳市低空基础设施高质量建设方案（2024—2026年）](https://fgw.sz.gov.cn/gkmlpt/content/12/12305/mpost_12305044.html) | 2025-07-31 / `page_publication` | 正式规划中列出起降、通信、导航、监视及SILAS功能；规划目标不等于已建成事实。 |
| [深圳龙华机场，来了！](https://www.szlhq.gov.cn/xxgk/xwzx/gzdt/content/post_12982043.html) | 2026-09-15 / `page_publication` | 区内已布局物流起降点；数字孪生平台对接美团、丰翼数据并处理飞行任务。 |
| [株洲：“无人机+北斗”低空综合服务中心启用](https://jtt.hunan.gov.cn/jtt/xxgk/gzdt/szdt1/202408/t20240823_33437155.html) | 2024-08-15 / `page_publication` | 列出物流、巡检与应急物资运输航线及综合服务中心；日期采用页面而非URL目录。 |
| [低空经济气象科技创新系列报道④高效观测助低空经济振翅而飞](https://www.cma.gov.cn/2011xwzx/2011xqxxw/2011xqxyw/202502/t20250214_6852409.html) | 2025-02-14 / `page_publication` | 气象观测支撑低空运输、应急救援和飞行安全；文章部分内容是试点建设规划。 |
| [黑龙江监管局对飞龙通航135部空中游览运行进行专项督查](https://db.caac.gov.cn/DB_XXGK/DB_GZDT/202410/t20241016_225618.html) | 2024-10-10 / `page_publication` | 直升机景区空中游览、运行审定和气象放行条件。 |
| [Z15（AC352）获颁证！填补国产民用中型直升机领域空白](https://app.caac.gov.cn/PHONE/XWZX/MHYW/202207/t20220726_214744.html) | 2022-07-26 / `page_publication` | 民用多用途直升机及搜索救援、医疗救护用途。 |
| [JOUAV Unveils Next-Gen VTOL Hangar for Automated Power Line Inspection](https://www.jouav.com/news/next-gen-vtol-hangar-unveiled.html) | 2024-04-25 / `page_publication` | CW-15V机库系统具备电力巡检、自动起降、充电及联网控制能力。 |
| [Thermal coatings for titanium-aluminum alloys (NASA-TM-107760)](https://ntrs.nasa.gov/citations/19930016859) | 1993-04-01 / `page_publication` | 钛合金航空结构材料研究；研究对象是高超声速结构，不能证明通航/eVTOL装机。 |
| [民航局下发《民用航空低空空域监视技术应用指导意见》](https://www.caac.gov.cn/XWZX/MHYW/201704/t20170421_43752.html) | 2017-04-18 / `page_publication` | 北斗定位与低空监视服务保障的政策框架；不说明具体机型或巡检任务。 |
| [中国民用航空局党组书记、局长宋志勇：高质量发展通用航空和低空经济](https://www.caac.gov.cn/XWZX/MHYW/202501/t20250103_226313.html) | 2025-01-03 / `page_publication` | 产业与应用背景；不用于证明某个材料或具体技术连接。 |
| [Computer Vision (Optical Flow, MoCap, VIO, Avoidance) — PX4 v1.14](https://docs.px4.io/v1.14/en/computer_vision/) | 未知 / `not_available` | 相机光流和视觉惯性里程计提供位置/速度估计；页面未给出发布日期。 |
| [亿航EH216-S型无人驾驶航空器系统专用条件](https://www.caac.gov.cn/XXGK/XXGK/BZGF/ZYTJHHM/202202/t20220222_211914.html) | 2022-02-09 / `page_publication` | 型号适航要求；不等于特定商业运营和物流航线已经获批。 |

## 仍需补证

剩余8条关系不是已证伪，而是未找到足够具体的一手材料。应补充明确机型、部件或运营任务的资料，不能继续复用宏观产业文章。10条事件规则有技术或应用背景来源，但仍需具体政策范围、合同履约、成本敏感度和运营条件等证据。

宝钛与国资委中国移动相关页面检索命中，但正文未能稳定复核；本次未将其候选摘要当作直接依据。检索记录保存在 `additional_search_notes`。
