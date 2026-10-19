# 技能阅读器

复用 ECC Capabilities 的卡片、搜索和详情布局，用中文学习说明理解技能，再阅读完整原文。

每张卡片展示 **技能调用名、技能中文名、技能概括、技能使用场景**。当前只维护 348 项 ECC 技能，支持模块与分类、关键词与多标签交集筛选、真实调用名复制、完整 Markdown 和包内关联文档。正文默认 20px，适配窄屏与键盘操作。

## 启动

需要 Node.js 22 或以上。第一次准备：

```bash
npm ci
npm run build
```

当前机器已配置来源，运行：

```bash
npm start
```

打开 <http://127.0.0.1:3457/>。在启动进程的终端按 **Ctrl+C** 停止。阅读器只运行本次启动的进程，不安装系统常驻服务。重启仍使用 `npm start`；端口占用会明确报错，不会结束其他进程。

另一个端口可通过环境变量指定：

```bash
SKILL_READER_PORT=3458 npm start
```

前端文件改变后重新 `npm run build`，浏览器刷新即可加载新界面。服务器代码或来源配置改变后重启进程。技能正文和中文笔记改变后，点击 **刷新资料** 会重新校验库存与说明；来源变化时旧笔记显示“待复核”。

## 来源配置与迁移

运行时从 `.local/sources.json` 读取显式批准的技能包路径。迁移到另一台机器时：

1. 将 `config/sources.example.json` 复制为 `.local/sources.json`。
2. 填写本机已安装包的绝对 `root` 和对应 `version`，包内须有匹配的 `.codex-plugin/plugin.json`。
3. ECC 原生入口为 `skills`，迁移技能入口为 `.codex-plugin/migrated-command-skills`。当前配置仅包含 ECC，不需要迁移其他来源的学习资料。

配置文件也可通过 `SKILL_READER_CONFIG` 指定。公开代码不含个人路径，运行时不扫描整个主目录，也不依赖原 ECC 预览服务或其端口。

服务仅监听回环地址。跨设备阅读可在已有 SSH 连接上转发此端口；不要直接将私有内容服务暴露到公网。

## 中文学习笔记

- `data/learning-notes/ecc.json`：348 项公开 ECC 学习说明，原生 311、迁移入口 37。
- 技能原文始终从技能包只读读取，不随本项目公开。

笔记包含稳定 `id`、真实 `callName`、`nameZh`、`summaryZh`、`scenariosZh`、`tags`、`category`，以及已核对的 `version` 和完整源文件字节 SHA-256 `sourceHash`。它们是学习概括，不是官方全文翻译。

新增或修改笔记时先核对原文用途与适用边界，再更新字段。只有人工复核来源后才更新版本和哈希；不要批量更新哈希来隐藏过期状态。缺失说明显示“待整理”，来源变化显示“待复核”。

所有界面、代码和中文笔记维护都在独立项目进行。来源技能中的命令仅作阅读内容，不由阅读器执行。

## 验证

```bash
npm test
npm run build
npm run check
npm run test:e2e
```

`test:e2e` 使用独立的临时测试来源和浏览器配置，不连接用户浏览器。优先发现本机 Chrome／Chromium，也可设置 `SKILL_READER_TEST_BROWSER`。缺少可运行浏览器会失败，不会假报通过。测试数据在结束后删除，结果写入被忽略的 `.local/acceptance/`。

已启动真实阅读器时可运行 `npm run smoke`，核对全部来源、中文说明关联及每一项正文完整性。

`npm run baseline` 对比受保护来源的文件、Git 和原预览服务信息，需本机 `.local/protection.json` 与最初记录的基线。检测差异只报告，不恢复文件。本机基线不随项目公开；用户明确要求重启原预览时，单独追加重启记录，保留最初来源基线。

实际验收及平台边界见 `docs/acceptance.md`，上游来源与许可见 `docs/upstream.md` 和 `THIRD_PARTY_NOTICES.md`。
