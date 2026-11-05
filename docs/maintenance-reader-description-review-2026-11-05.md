# Matt 技能中文描述独立复核

日期：2026-11-05。状态：研究完成；以下发现对应fc230a2基线，后续修订见文末。

## 范围与基线

复核现有 Matt 指南的27项说明、调用示例和相互关系。页面基线为提交 `fc230a2b4144bc4a3d9cd6b1a5d914f4fa8014fb`；要求来自[既有计划第11节 S4 v0.2](../plans/maintenance-development-reader-plan.md)：保留阶段布局、调整必要顺序、讲清技能关系、使用直白中文。本轮只产出研究报告，不修改网页。

原始依据为 Matt 1.3.2、提交 `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`。主代理核对27项条目齐全，27份本地原文 SHA-256 与[固定来源清单](../web/guides/mattpocock-skills/source-manifest.json)逐项匹配；不声称代表上游最新版本。

四位独立子代理从新上下文开始，均未参与该版页面编写。前三位分别审读10、10、7项原文与页面；第四位阅读全页中文并核对全局关系。主代理对以下发现重新读取相关原文，按实际影响归类，不照搬分组给出的严重度，也不以历史“通过”结论替代本轮证据。

## 结论

**仍有2处实质误导、5处值得修正的适用条件或技能关系表述，以及6组补充或表达建议。** 后两类不等于技能运行故障，不要求把上游全文搬进指南。

当前组合关系和大多数按需选择说明已经改善；本轮没有发现必须再调整八阶段顺序或跨阶段迁移技能的证据。保留现有顺序，优先修正下面的局部内容。顺序判断依据为[固定源 ask-matt 的主流程与其他入口](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L15-L67)，以及页面各条目的条件说明。

## 优先修正的2处实质误导

### R1 · wayfinder 把默认路线写成唯一执行边界

- 页面：[wayfinder](../web/guides/mattpocock-skills/index.html#skill-wayfinder)，第64行：“仅当工作确实很小时才直接实施”。
- 依据：[wayfinder 原文第9—13行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wayfinder/SKILL.md#L9-L13)允许在该项目的 Notes 中明确将执行纳入地图；“默认只作决定”有这个例外，并非只有小工作才能包含执行。
- 需要保留的区别：[ask-matt 第52—54行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L52-L54)确实建议默认交接到规格和任务，只有工作很小时才直接 implement。当前中文并非无源之说，但把路由中的默认建议概括成了技能本体的唯一边界。[wayfinder 第111—112行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wayfinder/SKILL.md#L111-L112)另要求：若已无未知、一个会话就能完成，则不必建图，先问用户如何继续。
- 建议白话：“默认先把问题和决定理清，再交接后续实施；如果本次地图的 Notes 已明确包含实施，就按该约定推进。若工作已经清楚且很小，可不建图，先确认接下来怎么做。”这不是授予实际实施权限。

### R2 · 场景标题混淆“需求是否正确”和“代码是否实现需求”

- 页面：[场景示例](../web/guides/mattpocock-skills/index.html#examples)，第150行：“标准正确，需求仍可能错误”。同一场景正文实际讲的是规范检查和需求实现检查。
- 依据：[code-review 原文第6—11行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md#L6-L11)检查代码是否符合规范、是否忠实实现原始规格；它不因此证明需求本身正确或错误。
- 建议白话：“代码符合规范，也可能没有实现需求。”条目正文第133—135行本身无需因此被判为错误，问题在场景标题。

## 建议修正的5处条件或关系表述

| 编号／页面位置 | 查证与影响 | 建议表达 |
| --- | --- | --- |
| R3 · [ask-matt](../web/guides/mattpocock-skills/index.html#skill-ask-matt)，第22行 | “单项实施可从完整任务说明重新开始”弱化了逐任务 implement 路线的新上下文要求，也容易与留在当前会话的小任务混淆。[原文第24—28行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L24-L28)、[第36—40行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L36-L40)明确逐任务重新开始；小任务则留在当前上下文。 | “逐项 implement 时，每项从完整任务说明和新上下文开始；能在当前会话完成的小任务则直接在这里做。”只描述该路线，不扩大到所有实施方式。 |
| R4 · [to-spec](../web/guides/mattpocock-skills/index.html#skill-to-spec)，第91行及第150行场景 | “工作需要跨会话实施时”是 ask-matt 的典型选路条件，但 [to-spec 自身第3—19行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-spec/SKILL.md#L3-L19)并未限制必须跨会话。当前表达容易让本会话也需要正式规格的人误判不适用；不能据此说页面明文禁止同会话使用。 | “需要把已有讨论整理成规格时使用，尤其适合后续跨会话协作；小任务不必机械地先写规格。” |
| R5 · [to-tickets](../web/guides/mattpocock-skills/index.html#skill-to-tickets)，第105—109行 | 标题和首句突出规格／计划，未明确当前对话也能直接作为输入。[原文第3—17行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-tickets/SKILL.md#L3-L17)明确接受计划、规格或当前对话。结合阶段排列容易多加一次写规格步骤；页面“已有结论”并不直接否定对话输入，所以属于入口不清楚。 | “把已经讨论清楚的工作拆成小任务；可直接使用当前对话，也可使用已有规格或计划，不要求先运行 to-spec。” |
| R6 · [code-review](../web/guides/mattpocock-skills/index.html#skill-code-review)，第134—135行 | 只介绍仓库规范，未解释即使仓库无规范，也会带入固定的代码异味检查建议。[原文第38—41行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md#L38-L41)说明这一范围，且仓库规范优先、异味只是判断建议，不是硬性违规。属于检查范围概括不足，无需列出全部异味。 | “除仓库规范外，还检查一些常见的代码结构问题；这些判断是改进建议，不能直接当作违规，仓库明确规定优先。” |
| R7 · [retro](../web/guides/mattpocock-skills/index.html#skill-retro)，第145—146行 | 未介绍其内部引用 writing-for-agents。[原文第9—13行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/retro/SKILL.md#L9-L13)将其列为第一步。这不推翻当前对复盘对象的正确说明，但在介绍技能关系时值得补齐。 | “内部先参考 writing-for-agents 的写作指南，再阅读会话记录。”不要让用户另起一轮重复调用。 |

## 6组补充或表达建议

以下不按客观语义错误计数。目的是减少误读，并保持指南简洁。

1. **triage 限定常规流程，补充直接指定状态的入口。** [页面第26行](../web/guides/mattpocock-skills/index.html#skill-triage)的“先建议、等待指示、再核查”对应[原文第72—76行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/triage/SKILL.md#L72-L76)，但[第88—90行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/triage/SKILL.md#L88-L90)另有维护者直接指定状态的入口。可加“常规分诊时”；若补充例外，仍保留冲突与异常转换的询问要求，不把例外写成忽略这些限制。
2. **triage 说明人工接手 PR 的含义。** 页面第26行“代理或人工执行的任务简报”没有明确说人工要重新实现，不能据此定为客观错误。不过[原文第35—39行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/triage/SKILL.md#L35-L39)区分：Issue 的人工就绪是人工实现，PR 的人工就绪是可由人工合并。补这一点更清楚。
3. **wizard 写清谁来确认步骤。** [页面第127行](../web/guides/mattpocock-skills/index.html#skill-wizard)已有“确认人工步骤”，因此不宜直接说完全缺少确认；但确认方和时间点不够明确。[原文第18—25行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wizard/SKILL.md#L18-L25)要求先展示步骤和所需值，交用户确认后再编写。建议改为“先列出步骤、需要获取的值和保存位置，交你确认后再生成向导”。
4. **少量英文仍需就地解释。** [teach 第53行](../web/guides/mattpocock-skills/index.html#skill-teach)的 assets、[结构报告第81行](../web/guides/mattpocock-skills/index.html#skill-improve-codebase-architecture)的 CDN、[wizard 第129行](../web/guides/mattpocock-skills/index.html#skill-wizard)的 CI secret 可分别写成“课程共用组件和素材”“从网上加载样式和图形库”“自动化构建所需的凭据”。保留实际文件名、命令和必要英文。含义依据：[teach 第12—20行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/teach/SKILL.md#L12-L20)、[结构报告第37—41行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/improve-codebase-architecture/SKILL.md#L37-L41)、[wizard 第8—20行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wizard/SKILL.md#L8-L20)。
5. **setup 第二段拆清条件，保留必要限制。** [页面第18行](../web/guides/mattpocock-skills/index.html#skill-setup-matt-pocock-skills)把文档优先级、安装 triage 的条件、旧文件迁名、远程仓库和标签写入集中在长段中。条件有据，不宜直接删掉；可按“确认后写什么／哪些情况才额外做”断句。[原文第65—106行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/setup-matt-pocock-skills/SKILL.md#L65-L106)。
6. **辅助工具点明可跨阶段使用。** [页面 teach、wait-what](../web/guides/mattpocock-skills/index.html#skill-teach)及[writing-for-agents、handoff](../web/guides/mattpocock-skills/index.html#skill-writing-for-agents)按阶段放置有利于查阅，但可在既有首句写清“独立学习工具”“跨阶段写作参考”“听不懂时随时重新解释”。[ask-matt 第81—93行](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L81-L93)将其列为独立工具。页面标题已有“按需选用”，handoff 也已排除每阶段必交接；不应重复报告为强制顺序错误，也不需要新增提示区域。

## 覆盖情况及未采纳为缺陷的意见

| 独立分组 | 逐项范围 | 覆盖与结果 |
| --- | --- | --- |
| 受理与澄清 | setup-matt-pocock-skills、ask-matt、triage、grill-with-docs、grill-me、grilling、domain-modeling、to-questionnaire、teach、wait-what | 10/10；ask-matt 的条件表述列入R3，triage两点作为补充建议；其余8项未确认语义偏差。 |
| 调查与规格 | wayfinder、research、prototype、diagnosing-bugs、improve-codebase-architecture、codebase-design、to-spec、writing-for-agents、handoff、to-tickets | 10/10；R1、R4、R5。原型细节和并行比较设计方法未完整介绍，但没有反向描述，不作为缺陷。 |
| 实施与复核 | implement、implement-spec、tdd、wizard、code-review、pr、retro | 7/7；R6、R7，wizard确认方作为表达建议。implement与implement-spec择一、内部测试／审查、提交副作用等核心关系未发现新的明确偏差。 |
| 全页语言与顺序 | 全部27项、正文示例及场景标题 | R2和英文解释、长段落、跨阶段工具三组建议。当前阅读顺序可保留。 |

- 不把 triage 的“人工执行”自动等同于“人工重新实现”；原句足够宽泛，分组的“客观错误”结论降为角色含义补充建议。
- 不把 wizard 的“确认人工步骤”当作完全没有确认要求；改为建议明确用户确认及先后次序。
- 不将 to-spec、to-tickets 的典型使用情境说成页面明文禁止其他入口；问题是容易被读成硬前提。
- retro 的“本指南将它放在验收后作为可选”明确标出了本地排列，不是冒充上游强制验收后才用；不因此要求重排。

## 验证、交付与后续

已执行：固定页面基线核对、27项完整性检查、27份原文哈希匹配、四个独立分组的页面／原文对照、主代理对发现的定向原文复查。记录保存于 `.local/matt-description-review/`，含 inventory.json、四份独立报告及 review-results.json。

未执行：程序测试、浏览器测试、实际技能调用、工单操作、源技能安装、业务或设备验证。本轮是内容研究；此前实施中的52项默认测试和42项浏览器检查不作为本轮中文语义通过的依据。是否符合用户阅读习惯仍待用户确认。

变更仅为本文及本地研究证据，网页、上游技能、现有规格和测试未修改，未提交或推送。建议先处理R1、R2，再用最少文字处理R3—R7；补充建议避免堆成长操作手册。报告不是修改授权或需求重新冻结。后续由主代理向用户提交具体修订范围，用户决定是否修改。

## 用户采纳后的修订跟踪 S5

上述为研究阶段的基线结论与范围记录。用户随后明确“同意修改”，已确认全部2+5+6项建议；主代理据此在既有计划第12节记录S5 v0.1冻结及验证方法，修改页面14项正文及相关示例、场景标题。八阶段布局及技能顺序保持。逐项验证、独立复核结果和未覆盖项见[计划第12节](../plans/maintenance-development-reader-plan.md)及.local/matt-s5/；不将原研究时的未实施状态或基线行号误作当前状态。

S5交付核对：上述13项均已逐项修改并经两位独立复核者对照原文核实，无遗留发现；构建、静态检查、42项浏览器回归及桌面／390px／禁用脚本检查通过。未重复运行默认52项测试，未执行被介绍技能或业务验证；用户最终中文理解验收仍待确认。
