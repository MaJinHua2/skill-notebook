# 测试资产与必要测试点

本索引于 2026-10-30 中文说明待复核提示排查中建立，并在用户要求“开始实施”后更新。执行代码保留在既有测试目录，本文件仅索引行为、证据和缺口。产品规则以 [阅读器契约](docs/contract.md) 为准；修前事实见本机 [排查记录](.local/diagnostics/note-stale-2026-10-30/diagnosis.md)。

实施范围、取舍及完成条件统一见 [修复方案 v3](plans/note-freshness-repair-plan.md)。两项程序修复已实施，当前来源中 21 个待处理资料项均已逐项审读后采纳。

## 执行入口

| 执行组 | 标准命令 | 依赖与本轮执行情况 |
|---|---|---|
| 默认回归 | `npm test` | Node；临时文件及本地 HTTP 端口。实施工作区与拟提交版本的独立结果分别记录于本次修复记录。 |
| 浏览器 | `npm run test:e2e` | 先构建；Playwright、Chrome/Chromium、隔离来源。31 项通过，退出 0。 |
| 真实资料 | `npm run smoke` | 运行中的本机阅读器与批准来源；350 项已核对、350 份正文检查通过，退出 0。 |
| 来源基线 | `npm run baseline` | 批准来源与历史基线；历史基线保留，来源变化不通过覆盖基线消除。 |
| 构建与静态检查 | `npm run build`、`npm run check` | 沿用项目入口，构建、语法、JSON、公开范围和笔记契约检查通过。 |

## 既有资产概览

| 资产组 | 级别 | 目的 | 位置 | 评估 |
|---|---|---|---|---|
| 来源、API、笔记关联与文件边界 | integration | rule protection, regression protection | `tests/server/app.test.mjs` | required |
| 网络访问策略 | unit | specialized protection | `tests/server/network.test.mjs` | required |
| 基线 CLI 与漂移检测 | integration | rule protection | `tests/server/baseline.test.mjs`、`scripts/source-baseline.mjs` | required |
| 筛选、路由及精确指南映射 | unit | rule protection | `tests/web/state.test.mjs`、`tests/web/embedded-guide.test.mjs` | required |
| 浏览器阅读路径 | E2E | critical path, regression protection | `tests/e2e/reader.mjs`、指南辅助文件及 `note-status.mjs` | required；混合状态告警已覆盖 |
| 真实来源与完整正文 | smoke, integration | critical path, regression protection | `scripts/smoke.mjs`、`tests/server/smoke.test.mjs` | required；失败产物生命周期已覆盖 |

已有资产 6 组均需保留；本轮两个缺失回归点已补齐，目前这三个登记测试点无 missing 项。未发现足以判为 possibly duplicate 或 possibly stale 的测试资产。历史验收记录不作为当前执行结果。

API 规则目前来自人工契约文档，未发现机器可校验的接口契约；本轮不将服务端集成测试宣称为完整的消费者／提供者 contract 测试。

## TEST-NOTES-HASH-001：同版本来源字节变化后保持真实说明状态

- 状态：`covered`，限于下述哈希、状态与刷新规则；不代表中文语义已复核。
- 来源：[完整文件摘要定义及说明状态](docs/contract.md)；本轮真实数据见 [实时库存](.local/diagnostics/note-stale-2026-10-30/live-inventory.json)。
- 代表输入：技能版本不变、正文变化、笔记仍关联旧摘要；随后显式刷新，或换为匹配的已审笔记。
- 观察：来源变化后状态为 stale，保留中文说明；检索及详情采用当前完整正文；匹配笔记后恢复 verified，移除笔记后为 missing。
- 级别：`integration`；目的：`rule protection, regression protection`；执行组：默认回归的定向子集。
- 边界：真实导入 `createApp`，临时来源与笔记，真实本地 HTTP；不修改安装包。
- 位置：`tests/server/app.test.mjs` 中 `matching, missing and stale learning overlays use version/hash/callName`、`explicit list refresh rereads skill and overlay snapshots without stale verified status`，以及 `changed skill bytes refuse a stale detail rather than combining old annotations and new instructions`。
- 实际命令：`node --test --test-concurrency=1 tests/server/*.test.mjs tests/web/*.test.mjs`。
- 结果：Node 24.21.0，标准入口中的上述三项规则回归通过，退出码 0；执行范围见 [本次修复记录](docs/note-freshness-repair-2026-10-30.md)。先前含本机兼容用例的 4 项定向排查证据另保留在本机诊断目录。未设置新的覆盖率门槛。

## TEST-NOTES-UI-001：多个待复核与待整理状态的告警呈现

- 状态：`covered`；目的：`regression protection`；级别：`E2E`；执行组：既有浏览器回归。
- 来源：[BUG-NOTES-UI-001](.local/diagnostics/note-stale-2026-10-30/diagnosis.md#bug-notes-ui-001重复且不可定位的告警)。
- 实际故障形态：多个 stale 与 verified、missing 并存；列表筛选无 stale 卡片时仍有多条相同全局告警，缺少定位入口。
- 修复断言引用确认方案：按来源汇总全库数量、状态分组及链接定位，保留普通诊断与既有筛选；不改变 stale 判定。
- 修前证据：真实 API 与内置浏览器 [DOM 观察](.local/diagnostics/note-stale-2026-10-30/ui-observation.json)。
- 测试：`tests/e2e/note-status.mjs`，由 `tests/e2e/reader.mjs` 调用；实际命令 `node tests/e2e/reader.mjs`。修前新场景因不存在汇总区域失败（0 与预期来源数不符）；修后三项场景及完整 31 项浏览器回归通过，退出 0。包含零异常、刷新清空、键盘、390px 布局及已核对/待复核/待整理混合状态。
- 修后证据：`.local/acceptance/e2e.json`、`.local/acceptance/note-status-mobile.png`；真实服务页面另保存 `.local/acceptance/note-status-live.jpg`。

## TEST-SMOKE-REPORT-001：失败运行不能被旧成功产物冒充

- 状态：`covered`；目的：`regression protection`；级别：`integration`；执行组：默认 Node 测试回归。
- 来源：[BUG-SMOKE-REPORT-001](.local/diagnostics/note-stale-2026-10-30/diagnosis.md#bug-smoke-report-001失败运行保留旧成功产物)。
- 代表输入：已有一次通过报告，随后来源出现待复核项并执行真实资料检查。
- 当前结果：命令退出码 1，但旧 JSON 仍为 passed；[本轮复现证据](.local/diagnostics/note-stale-2026-10-30/smoke-failure.json)。
- 按确认方案，报告表示最近一次获准启动的运行；运行身份、running/failed/passed 和退出码共同表达有效性，不放宽零诊断断言。
- 测试文件：`tests/server/smoke.test.mjs`；实际命令 `node --test --test-concurrency=1 tests/server/smoke.test.mjs`。修前成功后失败、配置失败两项均因报告仍为 passed 而失败；修后 7 项通过，退出 0，默认回归也通过。
- 覆盖成功→失败→成功、配置和连接失败、部分详情进度、启动 running、并发拒绝、硬中断和报告不可写。进程/文件/HTTP 边界使用临时来源与真实 CLI 子进程，不写真实验收目录。

## 维护边界

本轮已实施两项程序修复，并依据当前 350 项来源逐项处理 21 项资料变化，真实检查通过。结果及证据见 [本次修复记录](docs/note-freshness-repair-2026-10-30.md)。后续变更继续记录修前失败、修后结果和执行范围。默认回归、浏览器及真实来源检查各自提供证据；单项通过不替代其他层级的结论。
