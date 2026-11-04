# ECC 阅读器恢复记录（2026-10-29）

## 恢复结果

阅读器从已卸载的 Matt 来源恢复为当前已安装的 ECC 2.2.3：原生 311 项、迁移入口 36 项，共 347 项。运行服务的实际 API 和页面均已核对，刷新后诊断为 0。

中文说明和私有来源配置从切换 Matt 前的本机备份恢复，不依赖 Git 找回未跟踪资料。恢复后的文件与备份逐字节一致；未重新生成中文内容或批量更新来源摘要。347 条笔记与当前源文件 SHA-256 均匹配。当前插件来源 revision 为 `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b`，历史同步记录的 `f390400…` 保留为历史，未改装插件。

恢复 ECC 导航、十项嵌入式引导和准确的 ecc: 调用名；中文及原文搜索、标签/分类/工作流筛选、详情返回、关联 Markdown 和安全边界保留。旧 Matt 浏览器来源偏好会清除，保留有效的 ECC 查询状态。活动笔记不再加载 Matt 内容。

## 验证证据

- Node 24.22.1 单并发低优先级回归：41 项全部通过，覆盖来源、哈希与笔记状态、路径/符号链接、网络访问、筛选与 ECC 导航；新增批准插件目录、迁移入口、附件和包元数据的基线变化检测。
- 前端构建、语法/JSON/公开范围与 347 项中文笔记契约检查通过。
- 隔离 Chrome 浏览器回归：22 项通过，覆盖全文检索、组合筛选、复制、详情、两层附件、十项 ECC 精确引导、缺失资源、错误重试和窄屏布局。
- 重启既有 skill-reader 服务后，实际库存 347、verified 347、missing 0、stale 0、diagnostics 0；全部 347 份正文和检索快照逐项与源文件比较通过。
- 真实页面额外检查通过：347 张卡片、无告警、旧 Matt 偏好恢复、intent-driven-development 中文说明及原文、准确复制 ecc:intent-driven-development、返回保留搜索、10 项可用 ECC 引导、点击刷新保持零诊断及 390px 布局。页面无运行错误，截图已检查。
- 当前 ECC 插件 4712 个文件的内容摘要与恢复前完全一致。原网络配置、原先 .serena 文件及 ECC 同步说明等 4 个受保护文件摘要未变；Git 暂存差异未变。

现有用户服务恢复后为 active/running；端口和网络配置保持原样。本次没有安装/恢复 Matt、修改 ECC 插件或 Hook 信任、提交、推送或发布网站。

## 本机证据与历史保留

- 本次恢复前的当前工作区、未跟踪文件、私有配置、构建产物及旧测试产物备份：`.local/ecc-reader-restoration/before-20261029-111209/`，包含压缩包、清单、暂存差异和 ECC 文件摘要。
- 原 ECC 中文笔记及来源配置备份：`.local/migrations/2026-10-26-mattpocock/before/`。
- 真实服务正文核对：`.local/acceptance/smoke.json`；隔离回归：`.local/acceptance/e2e.json`。
- 真实页面记录与截图：`.local/ecc-reader-restoration/live-ui.json`、`ecc-desktop.png`、`ecc-detail.png`、`ecc-mobile.png`；文件保留结果：`preservation.json`。
- 旧 Matt 基线另存 `.local/ecc-reader-restoration/matt-baseline-before-ecc.json`。新的批准来源基线位于 `.local/source-baseline.json`，覆盖 1065 个文件及目录；历史 ECC 基线和既有验收记录未覆盖。

这些检查证明本次阅读器恢复及资料关联，不代表执行了全部 ECC 技能、其外部依赖或交付流程。
