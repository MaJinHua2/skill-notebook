# 技能内容与界面来源

## 历史 Matt Pocock 内容（当前未加载）

安装锁记录来源为 `mattpocock/skills`，上游 <https://github.com/mattpocock/skills>。本次固定本机已安装的 38 项，仅只读批准技能和本技能 Markdown 附件，没有更新上游或复制原文到公开项目。中文说明是独立学习笔记。工程开发 18、生产力 7、in-progress 9、杂项 4 为安装记录中的分组；不据此断言当前上游成熟度。

## 历史界面复用来源

- 上游：https://github.com/affaan-m/ECC
- 参考提交：`76aaa77df6adc5b889e689007bf99b9a4f74af34`
- 参考文件：`scripts/dashboard-web.js`
- 许可：MIT，完整许可见 `THIRD_PARTY_NOTICES.md`。

阅读器复用卡片列表、搜索/分类、hash 详情页、CSS 变量和系统字体栈的界面组织思路，在独立文件中调整字体、中文四项信息、筛选状态与安全 Markdown 阅读。后端独立实现，不导入或运行上游 dashboard 脚本，不读取其活动日志或账户配置，不依赖其 HTTP 服务。

界面参考的是固定提交；历史 Matt 技能内容曾来自本机明确批准的独立技能目录。这两种来源分别记录，互不替代。技能原文不会随本项目一起公开；中文概括是独立学习笔记，不声称为官方翻译。

当前阅读器已恢复读取本机 ECC 插件 2.2.3 的原生技能及迁移入口；源码 revision 见本机安装元数据，实际正文以源文件摘要核对。

## Mattpocock Skills 指南（静态阅读资料）

- 上游：[mattpocock/skills](https://github.com/mattpocock/skills)。
- 本地固定源插件版本：`1.3.2`。
- 固定源码 HEAD：`4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`，未拉取或更新上游。
- 页面：`/guides/mattpocock-skills/index.html`；阅读器入口：`/#/guides/mattpocock-skills`。
- 许可：MIT，`Copyright (c) 2026 Matt Pocock`；完整许可见 `THIRD_PARTY_NOTICES.md` 及指南的 `LICENSE.txt`。
- 来源文件摘要与阅读内容范围见指南 `source-manifest.json`。源文档中的命令是被介绍的资料，不是阅读器的操作指令；内容概括不代表实际执行或技能验收。

静态指南不恢复历史 Matt 技能库存，不扩展 `/api/skills` 或来源配置。上述历史安装记录与本次固定源码分别记录，不能互相替代。
