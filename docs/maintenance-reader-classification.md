# Matt 指南27项阅读分类台账

需求：reader-maintenance-development-20261104；本记录限既有 Matt 指南阅读分类。

用户已确认 ECC 淘汰；本轮不恢复或新增来源，不导入 Matt 为运行时库存，不修改来源配置或路由。
为未来运行时分类准备的状态、迁移和空映射增量已撤回；原有状态及其测试按执行前工作区备份精确恢复，不以 Git HEAD 替代。
指南现有27项分类、阶段说明、原章节／锚点／复制能力保留；不新增来源待决项。

仅修改现有 `web/guides/mattpocock-skills/guide.js` 及本台账；不修改指南 HTML、资源白名单、来源配置、运行时库存或路由，不全面改写章节。
固定来源：`mattpocock/skills`，版本1.3.2，提交 `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`。
本次实际完整阅读 manifest 所列27份 SKILL.md（共1885行，按含尾换行的分行计数），27/27 SHA-256与既有 `source-manifest.json` 相符；本地固定源码工作树 HEAD 相符且 `git status --porcelain` 为空。
未纳入 misc／in-progress，不下载或更新来源，不将这27项导入 runtime。
以下是**既有阅读资料分类**，不是宿主已安装或可执行的能力列表。

### 控件与阶段说明

- `#work-type-filter [data-workflow]`：all／feature／maintenance／support；默认 all，`aria-pressed` 标识当前入口。
- 原 `#stage-filter`：all 时按三种入口分组列出全部阶段；选主流程显示七阶段，选支持显示三个组；切入口清阶段但保搜索。
- 原卡片 `id=skill-<slug>`、原 `data-stage`、章节、锚点及复制目标保留。`data-workflow-stages` 仅补充空格分隔的阅读归属。
- `#guide-stage-context`：`h3` 当前阶段／流程名，`dl` 为目标、需要准备、应得到什么。阶段说明由指南脚本内的阅读导航数据维护；这些是阶段目标，可能需要多项技能或人工完成。
- 显式 `readingMembership` 和纯函数 `readingScope/matchesReadingScope` 与DOM适配分开；不按原 data-stage、标签或名称推断归属。
- 流程并集／多阶段采用同一张卡片的可见性判断，不克隆卡片；搜索词仍取交集；重置回 all 并清搜索。
- 原复制成功及失败反馈保留；脚本不加载时原始27卡片和人工选择文本仍可读。分类不执行技能、命令或网络请求。

### 27项逐项原文依据与阅读归属

下表完整卡片ID沿用 `skill-<slug>`。引用行号对应本地已核对固定原文；完整原文SHA-256以既有 manifest 各 stableSkills.sha256为准。

| 卡片 ID | 显式阶段／支持组 | 原文依据与归属边界 |
| --- | --- | --- |
| `skill-ask-matt` | `project-context` | [skills/engineering/ask-matt/SKILL.md:11-34](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L11)；路由到合适技能与主流程；放项目理解，不把路由当实施或验收。 |
| `skill-grill-with-docs` | `feature-clarify`, `feature-design`, `maintenance-solution`, `docs-collaboration` | [skills/engineering/grill-with-docs/SKILL.md:3-7](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/grill-with-docs/SKILL.md#L3)；原文组合 grilling 与 domain-modeling：澄清／论证方案、记录术语与决定；维护仅限修复方案讨论，不代替复现定位。 |
| `skill-triage` | `feature-clarify`, `maintenance-collect`, `maintenance-diagnose`, `docs-collaboration` | [skills/engineering/triage/SKILL.md:68-86](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/triage/SKILL.md#L68)；收集来报上下文、复现报告、必要时澄清并形成可接手简报；不把拒绝工单的关闭动作冒充修复验收。 |
| `skill-improve-codebase-architecture` | `feature-impact`, `feature-design`, `maintenance-solution` | [skills/engineering/improve-codebase-architecture/SKILL.md:18-35](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/improve-codebase-architecture/SKILL.md#L18)；探索结构阻力、给候选后再论证（60-71）；维护仅用于已知测试接入点不足等结构问题，非通用故障诊断。ask-matt:50明确指向该后续。 |
| `skill-setup-matt-pocock-skills` | `environment-tools` | [skills/engineering/setup-matt-pocock-skills/SKILL.md:9-15](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/setup-matt-pocock-skills/SKILL.md#L9)；配置工单、标签和领域文档布局；归环境工具，配置行为需按条目与真实授权。 |
| `skill-to-spec` | `feature-plan` | [skills/engineering/to-spec/SKILL.md:7-19](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-spec/SKILL.md#L7)；综合已有讨论与现状形成规格，先确认测试边界；归计划，不替代需求访谈。 |
| `skill-to-tickets` | `feature-plan`, `maintenance-plan` | [skills/engineering/to-tickets/SKILL.md:25-67](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-tickets/SKILL.md#L25)；将方案拆成可验证纵向切片与阻塞依赖，经用户确认后发布；新开发／修复均仅归计划。 |
| `skill-implement` | `feature-implement`, `maintenance-implement` | [skills/engineering/implement/SKILL.md:7-17](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement/SKILL.md#L7)；按规格或工单实施，使用既定测试边界，执行检查并调审查；归实现，原文的提交动作仍受真实授权限制。 |
| `skill-implement-spec` | `feature-implement` | [skills/engineering/implement-spec/SKILL.md:7-40](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement-spec/SKILL.md#L7)；按规格／工单任务图在集成分支组织实现；归新需求实现，不把编排当验收。 |
| `skill-wayfinder` | `feature-clarify`, `feature-design`, `feature-plan` | [skills/engineering/wayfinder/SKILL.md:7-13](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wayfinder/SKILL.md#L7)；大型模糊任务先定目标并产出决定；111-128说明决策图与逐项论证；归澄清／方案／计划，不当作实现。 |
| `skill-retro` | `environment-tools`, `docs-collaboration` | [skills/engineering/retro/SKILL.md:7-25](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/retro/SKILL.md#L7)；复盘代理环境：导航、自动检查、规范、工具与信息；归环境工具和文档协作，不假装审查代码或验收交付。 |
| `skill-prototype` | `feature-design`, `maintenance-solution` | [skills/engineering/prototype/SKILL.md:8-26](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/prototype/SKILL.md#L8)；用一次性状态／界面原型回答一个设计问题；新需求方案或已明确问题的修复方案均可；不替代真实故障反馈环。 |
| `skill-diagnosing-bugs` | `maintenance-collect`, `maintenance-diagnose`, `maintenance-solution`, `maintenance-implement`, `maintenance-verify` | [skills/engineering/diagnosing-bugs/SKILL.md:18-138](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L18)；Phase1建立原症状反馈环，Phase2复现最小化，Phase3假设，Phase4探针，Phase5修复和回归，Phase6原场景复验／清理；据此明确维护五阶段，未归计划或人工验收。 |
| `skill-research` | `feature-impact`, `project-context` | [skills/engineering/research/SKILL.md:6-12](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/research/SKILL.md#L6)；委派查高可信一手资料并留下带引用记录；归现状资料调查与项目理解，不当通用故障定位器。 |
| `skill-tdd` | `feature-plan`, `feature-implement`, `maintenance-plan`, `maintenance-implement` | [skills/engineering/tdd/SKILL.md:18-38](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/tdd/SKILL.md#L18)；写测试前确认公开测试边界（22-24），一条测试到最小实现的红绿循环（34-38）；对应两流程的计划与实现，不归独立审查。 |
| `skill-domain-modeling` | `feature-clarify`, `feature-design`, `project-context` | [skills/engineering/domain-modeling/SKILL.md:42-74](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/domain-modeling/SKILL.md#L42)；澄清业务概念、交叉核对代码并即时维护术语／适用ADR；归需求、方案和项目理解；只读已有术语不等于启动建模。 |
| `skill-codebase-design` | `feature-design`, `maintenance-solution`, `project-context` | [skills/engineering/codebase-design/SKILL.md:6-28](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/codebase-design/SKILL.md#L6)；共享接口、模块与可替换位置的设计语言；54-114提供接口设计与可测试性原则；归方案与项目理解，维护仅用于确需讨论接口／测试位置的方案。 |
| `skill-code-review` | `feature-verify`, `maintenance-verify` | [skills/engineering/code-review/SKILL.md:6-32](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md#L6)；固定比较基点，独立按规范和需求两轴检查；归两流程验证阶段，不拿规范通过替代需求通过。 |
| `skill-pr` | `feature-deliver`, `maintenance-close`, `docs-collaboration` | [skills/engineering/pr/SKILL.md:12-32](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/pr/SKILL.md#L12)；PR说明含变化、前后证据与合并风险；158-170解释证据／可回退性。归交付／关闭材料与文档协作，不表示已合并、关闭或业务验收。 |
| `skill-wizard` | `environment-tools` | [skills/engineering/wizard/SKILL.md:8-25](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wizard/SKILL.md#L8)；为只有人能操作的流程生成交互脚本；39-44静态核对并交接，不自行端到端执行；归环境工具。 |
| `skill-grill-me` | `feature-clarify`, `feature-design`, `maintenance-solution` | [skills/productivity/grill-me/SKILL.md:3-7](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grill-me/SKILL.md#L3)；调用 grilling 访谈原语；归需求及方案论证，维护仅限修复方案讨论，原文不写持久化文档。 |
| `skill-grilling` | `feature-clarify`, `feature-design`, `maintenance-solution` | [skills/productivity/grilling/SKILL.md:6-30](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grilling/SKILL.md#L6)；按已明确前提分轮澄清计划／设计选择，事实先查、决定由用户作；适用于需求与修复方案论证，不代替复现。 |
| `skill-handoff` | `docs-collaboration` | [skills/productivity/handoff/SKILL.md:8-16](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/handoff/SKILL.md#L8)；将当前讨论写成临时交接文档，引用既有事实并脱敏；仅通用文档协作，不当项目正式交付或完成证明。 |
| `skill-teach` | `project-context` | [skills/productivity/teach/SKILL.md:8-20](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/teach/SKILL.md#L8)；跨会话教学工作区记录目标、资料、课程和学习结果；归项目理解中的概念学习支持，不声称自动了解代码库。 |
| `skill-to-questionnaire` | `docs-collaboration` | [skills/productivity/to-questionnaire/SKILL.md:7-16](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/to-questionnaire/SKILL.md#L7)；明确接收者及所缺事实／决定，写供别人填写的问卷；仅通用文档协作，不代表已发出或拿到批准。 |
| `skill-wait-what` | `docs-collaboration` | [skills/productivity/wait-what/SKILL.md:3-7](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/wait-what/SKILL.md#L3)；补上下文并重述上一条未理解的解释，使用已有领域术语；仅沟通支持，不指定中文为源技能规则。 |
| `skill-writing-for-agents` | `docs-collaboration` | [skills/productivity/writing-for-agents/SKILL.md:6-18](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/writing-for-agents/SKILL.md#L6)；为技能、AGENTS／CLAUDE和引用文档组织清楚触发指针；29-59讲步骤／参考与完成条件；仅文档协作，不是安装器。 |

### 此增量的验证记录

- `node --check web/guides/mattpocock-skills/guide.js`：通过。
- 首次用 Playwright 默认 browser channel 启动失败：该配套浏览器未安装；未安装或下载任何组件。
- 改用项目现有测试策略所用的现存 Chrome，在内存中装入现有HTML／CSS／JS执行隔离页面检查：默认27、两流程／支持option、TDD与排障多阶段、阶段上下文、搜索AND、零结果／重置、支持分组均通过。
- 原卡片正文、链接及复制目标前后快照相同；复制成功／失败反馈通过；390px键盘选择、无横向溢出、无页面异常通过。
- 此检查不是真实服务／完整构建产物E2E；最终集成与四角色同版独立复核由主代理协调，用户对中文可理解性的验收未执行。
