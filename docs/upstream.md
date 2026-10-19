# ECC 界面来源

- 上游：https://github.com/affaan-m/ECC
- 参考提交：`76aaa77df6adc5b889e689007bf99b9a4f74af34`
- 参考文件：`scripts/dashboard-web.js`
- 许可：MIT，完整许可见 `THIRD_PARTY_NOTICES.md`。

阅读器复用卡片列表、搜索/分类、hash 详情页、CSS 变量和系统字体栈的界面组织思路，在独立文件中调整字体、中文四项信息、筛选状态与安全 Markdown 阅读。后端独立实现，不导入或运行上游 dashboard 脚本，不读取其活动日志或账户配置，不依赖其 HTTP 服务。

界面参考的是固定提交，技能内容来源则是本机显式配置的已安装技能包。这两种来源分别记录，互不替代。技能原文不会随本项目一起公开；中文概括是独立学习笔记，不声称为官方翻译。
