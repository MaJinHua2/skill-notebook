# Matt 指南27项阅读分类台账

当前需求：reader-matt-stage-content-20261104；版本：S3b；继承R1八阶段归属。冻结、授权与源码基线见 `plans/maintenance-development-reader-plan.md` 第10节。
用户确认单一八阶段流程、需求讨论提供多个可选入口、删除通用分组但保留全部27技能。以下分类取代旧双流程及支持组；只是阅读指南，不是上游强制执行顺序或宿主能力清单。
固定来源：`mattpocock/skills` 1.3.2，提交 `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`。不更新来源、不导入运行时库存、不恢复ECC。原文哈希另核对，不把历史验证当本轮结果。

## 控件与阶段说明

- 删除工作类型切换与通用分组；`#stage-filter` 为全部阶段及 intake、clarify、investigate、specify、split、implement、review、accept，顺序固定。
- `#workflow` 按上述八阶段顺序单列，每阶段下是对应技能的独立内容区域。2—3段主说明直接可见，说明实际工作、成果与必要边界；不增加状态、选路、阶段目标/准备/产出或下一步提示。
- 原有27个 `skill-<slug>` 完整条目和复制目标保留；`data-workflow-stages` 表达显式归属，跨阶段只引用同一完整条目。
- `#skills` 保留为搜索筛选入口；取消重复阶段说明区和单独技能索引卡片。搜索与阶段取交集，完整条目不克隆；无匹配条目的阶段隐藏，清除筛选回全部并清空搜索。
- 技能引用被筛选隐藏时恢复可见并定位，不能改变外层阅读器路由。默认／独立页／返回主列表保持原行为。
- 组合入口明确grill-with-docs→grilling＋domain-modeling，grill-me→grilling；组成方法可单独选用，不重复执行。
- 阶段8没有专属自动验收技能。用户或授权验收人核对实际证据；retro仅验收后复盘。工单／文件／Git写入受具体授权约束。

## 27项逐项原文依据与归属

下表是主要归属；跨阶段引用不改变技能实际能力。引用行号沿用固定原文依据，本轮已重新核对27份原文哈希。

| 卡片 ID | 主要阶段 | 原文依据与选择边界 |
| --- | --- | --- |
| `skill-ask-matt` | `intake` | [skills/engineering/ask-matt/SKILL.md:11-34](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/ask-matt/SKILL.md#L11)；不知道入口时选择技能路线。 |
| `skill-triage` | `intake` | [skills/engineering/triage/SKILL.md:68-86](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/triage/SKILL.md#L68)；核实外部反馈、分类并形成简报，不等于修复完成。 |
| `skill-setup-matt-pocock-skills` | `intake` | [skills/engineering/setup-matt-pocock-skills/SKILL.md:9-15](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/setup-matt-pocock-skills/SKILL.md#L9)；仅首次或配置缺失时配置工单、标签与领域文档。 |
| `skill-grill-with-docs` | `clarify` | [skills/engineering/grill-with-docs/SKILL.md:3-7](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/grill-with-docs/SKILL.md#L3)；访谈并整理领域术语与决定；内部组合grilling和domain-modeling。 |
| `skill-grill-me` | `clarify` | [skills/productivity/grill-me/SKILL.md:3-7](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grill-me/SKILL.md#L3)；调用grilling进行访谈，不按有没有仓库区分。 |
| `skill-grilling` | `clarify` | [skills/productivity/grilling/SKILL.md:6-30](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grilling/SKILL.md#L6)；直接使用分轮提问方法；已由组合入口调用时避免重复。 |
| `skill-domain-modeling` | `clarify` | [skills/engineering/domain-modeling/SKILL.md:42-74](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/domain-modeling/SKILL.md#L42)；主动澄清业务概念并维护术语；可在调查阶段引用。 |
| `skill-to-questionnaire` | `clarify` | [skills/productivity/to-questionnaire/SKILL.md:7-16](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/to-questionnaire/SKILL.md#L7)；向知情人收集信息或决定；生成问卷不等于已发送或批准。 |
| `skill-teach` | `clarify` | [skills/productivity/teach/SKILL.md:8-20](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/teach/SKILL.md#L8)；学习相关概念和知识，不冒充自动理解项目。 |
| `skill-wait-what` | `clarify` | [skills/productivity/wait-what/SKILL.md:3-7](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/wait-what/SKILL.md#L3)；补上下文、重新解释没有理解的内容。 |
| `skill-research` | `investigate` | [skills/engineering/research/SKILL.md:6-12](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/research/SKILL.md#L6)；查高可信一手资料并保留研究记录。 |
| `skill-diagnosing-bugs` | `investigate` | [skills/engineering/diagnosing-bugs/SKILL.md:18-138](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/diagnosing-bugs/SKILL.md#L18)；复现原症状、实验检验根因；后续实现与复核可引用其回归方法。 |
| `skill-prototype` | `investigate` | [skills/engineering/prototype/SKILL.md:8-26](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/prototype/SKILL.md#L8)；一次性原型验证设计问题，不当正式实现或真实业务验收。 |
| `skill-wayfinder` | `investigate` | [skills/engineering/wayfinder/SKILL.md:7-13](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wayfinder/SKILL.md#L7)；为大型模糊工作梳理决定地图，不当作实施清单。 |
| `skill-codebase-design` | `investigate` | [skills/engineering/codebase-design/SKILL.md:6-28](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/codebase-design/SKILL.md#L6)；设计模块边界、接口和测试位置。 |
| `skill-improve-codebase-architecture` | `investigate` | [skills/engineering/improve-codebase-architecture/SKILL.md:18-35](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/improve-codebase-architecture/SKILL.md#L18)；寻找架构改善候选；需有任务依据，不顺带扩展。 |
| `skill-to-spec` | `specify` | [skills/engineering/to-spec/SKILL.md:7-19](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-spec/SKILL.md#L7)；综合已讨论结论而非继续访谈；确认测试接口，发布工单按授权。 |
| `skill-writing-for-agents` | `specify` | [skills/productivity/writing-for-agents/SKILL.md:6-18](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/writing-for-agents/SKILL.md#L6)；辅助编写代理可执行文档；其他适用阶段仅引用同一完整条目。 |
| `skill-handoff` | `specify` | [skills/productivity/handoff/SKILL.md:8-16](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/handoff/SKILL.md#L8)；整理跨会话交接；各阶段边界可引用，交接不等于批准进入下一阶段。 |
| `skill-to-tickets` | `split` | [skills/engineering/to-tickets/SKILL.md:25-67](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-tickets/SKILL.md#L25)；用户确认后发布可独立验证的纵向任务及阻塞依赖，小任务可明确无需拆分。 |
| `skill-implement` | `implement` | [skills/engineering/implement/SKILL.md:7-17](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement/SKILL.md#L7)；实施单项明确任务；源技能包含检查、审查与提交，须核对真实授权。 |
| `skill-implement-spec` | `implement` | [skills/engineering/implement-spec/SKILL.md:7-40](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/implement-spec/SKILL.md#L7)；协调完整规格的实现，依赖规格及任务图；按任务选择，不机械重复implement。 |
| `skill-tdd` | `implement` | [skills/engineering/tdd/SKILL.md:18-38](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/tdd/SKILL.md#L18)；伴随实现逐行为红—绿—重构；不能排成代码结束后补测。 |
| `skill-wizard` | `implement` | [skills/engineering/wizard/SKILL.md:8-25](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/wizard/SKILL.md#L8)；为仅人能完成的步骤生成交互向导，不替人执行敏感操作。 |
| `skill-code-review` | `review` | [skills/engineering/code-review/SKILL.md:6-32](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/code-review/SKILL.md#L6)；按规范与需求双轴独立审查，不冒充项目要求的四角色复核。 |
| `skill-pr` | `review` | [skills/engineering/pr/SKILL.md:12-32](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/pr/SKILL.md#L12)；整理PR正文及前后证据，不表示已建PR、合并或发布。 |
| `skill-retro` | `accept` | [skills/engineering/retro/SKILL.md:7-25](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/retro/SKILL.md#L7)；验收后可选的代理工作环境复盘，不替代逐项业务验收。 |

## R1 历史验证状态

- 原文哈希：见本轮 `.local/matt-flow-r1/source-integrity.json`；来源manifest不修改。
- 页面与交互：已验证方法：通过；npm run test:e2e 42项通过，错误及外部请求均为0；preview.json记录无JS可读与390px无溢出。
- 四角色最终独立复核：各角色执行证据和结果见 `.local/matt-flow-r1/review-results.json`，未记录时不得推定通过。
- 用户最终页面与理解验收：未验证，不由测试或审查替代。


## S3b 当前验证状态

- 固定来源27/27原文哈希已核对；证据见.local/matt-s3b/source-integrity.json，不把来源阅读当技能运行。
- 本轮正文、27条目/归属/32调用及复制目标/全部外链保护：已验证方法：通过，见content-invariants.json；42项浏览器回归、无JS可读、桌面/390px单列无溢出通过，见e2e.json/layout.json。
- 四角色最终复核：实际执行证据与结果见.local/matt-s3b/review-results.json；无记录不得推断通过。
- 用户最终内容/视觉验收、Windows/Edge及原生缩放：未验证。
