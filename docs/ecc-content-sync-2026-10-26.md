# ECC 内容同步复核记录（2026-10-26）

## 来源与结论

- 原来源提交：`76aaa77df6adc5b889e689007bf99b9a4f74af34`；当前已安装来源提交：`f3904009440af24f00617343910ee89714df8be3`。当前提交包含原提交，增加 109 个提交，包版本仍为 `2.2.3`。
- 阅读器继续只读使用当前安装包；本次未拉取上游、安装插件或执行技能正文命令。
- 当前技能为原生 311 项、迁移入口 36 项，共 347 项；相对原 348 条中文说明，没有新增技能，12 项正文变化，1 项迁移包装入口缺失。
- 12 项逐项复核，其中 6 项修订中文、6 项确认现有概括仍准确后保留文案；335 项原有说明与当前来源一致，未修改。
- 本记录中的“复核”表示对照技能原文及其差异审读说明；来源哈希匹配只证明文件关联一致，不表示执行并验证了技能所描述的外部工具、Hook 或发布流程。

## 逐项复核

| 技能 | 处理 | 原始差异及判断依据 |
|---|---|---|
| `source-command-auto-update` | 保留中文，复核后更新哈希 | 仅路径解析增加 Linux/WSL 下 Windows 盘符转换；拉取上游并重装现有管理目标的用途未变，保留中文概括与场景。 |
| `source-command-instinct-status` | 保留中文，复核后更新哈希 | 仅路径解析增加 Linux/WSL 下 Windows 盘符转换；读取项目/全局经验规则及置信度的用途未变，保留中文概括与场景。 |
| `ck` | 修订中文并更新哈希 | 脚本改为相对技能目录定位，保持项目目录为工作目录；JSON 改用带引号 heredoc，修正 Hook 路径展开。中文概括补充安装路径与工作目录边界。 |
| `delivery-gate` | 修订中文并更新哈希 | 磁盘低于 50GB 提醒、30GB 警告、15GB 阻断；复杂任务为至少 3 次 Edit/Write，学习库至少 3 项过期或 growth-log 过期才阻断；缺少记忆目录跳过学习检查；同次 Stop 的 stop_hook_active 续跑放行；安装 timeout 改为 5 秒。 |
| `django-security` | 保留中文，复核后更新哈希 | 移除 SECURE_BROWSER_XSS_FILTER 示例；CSRF_COOKIE_HTTPONLY 改为 False 供 AJAX 读令牌，SESSION_COOKIE_HTTPONLY 仍为 True。现有中文概括只描述审查范围，未宣称这些具体值，保持准确。 |
| `fastapi-patterns` | 保留中文，复核后更新哈希 | 路由示例补充 Depends 导入。依赖注入、事务、鉴权和测试的用途范围未变，保留中文概括及场景。 |
| `laravel-security` | 保留中文，复核后更新哈希 | 表单验证示例移除 sanitize_html 规则。现有中文说明未承诺该规则，安全审查的用途与场景不变。 |
| `opensource-pipeline` | 修订中文并更新哈希 | 清理和包装的后续修改必须并入单一发布提交；包装后重新扫描，记录 SCANNED_COMMIT，发布前核对 HEAD、提交数和工作树；报告不进入发布提交。中文补充打包后复核和实际发布提交一致性。 |
| `perl-security` | 保留中文，复核后更新哈希 | Perl::Critic 示例移除 RequireThreeArgOpen 和 RequireTaintChecking 两条配置；正文仍有三参数 open、污点和输入校验指导。概括未承诺被移除的规则，因此保留。 |
| `python-testing` | 修订中文并更新哈希 | 区分 Flask 的共享 fixture/API 示例与 FastAPI 异步 fixture；FastAPI 改用 pytest_asyncio、httpx ASGITransport 和 LifespanManager，处理启动与关闭事件。中文补充两类客户端及生命周期。 |
| `safety-guard` | 修订中文并更新哈希 | 当前原文明示此技能是代理自行遵循的指导；未附带 /safety-guard 命令或强制 Hook，也不再宣称拦截日志。中文移除自动拦截暗示，明确行为约束性质。 |
| `social-publisher` | 修订中文并更新哈希 | 登录由用户在自己的终端完成，避免代理把密钥展开为进程参数；apply 会真实发布或排程，须确认具体帖子，内容变化需重新确认，不能与生成内容同一步执行。 |

## 缺失迁移入口

当前安装包不再提供 `ecc/migrated/source-command-skill-host-compat` 包装入口，原生 `ecc/native/skill-host-compat` 及上游 `commands/skill-host-compat.md` 均仍存在。本次仅从当前生效说明库移出旧包装记录，保留原生技能，不推断为整个技能删除，也不推断包装入口缺失的具体安装原因。

旧记录完整内容及其原文正文已归档到被 Git 忽略的本机同步证据目录。12 项变更同时保留可重建并校验旧哈希的旧原文、当前原文、统一差异和新旧哈希。

## 可复查证据与验证方法

- 本机私有证据位于 `.local/acceptance/ecc-sync-2026-10-26/`，包括来源前后快照、原说明库备份、被移出的完整记录、逐项原文与差异、复核判断和校验和。
- 最初的 `.local/source-baseline.json` 保持原样。本次独立记录来源快照，并比较安装包文件、源码仓库提交、未提交差异及未跟踪文件，确认本次操作未改动只读来源。
- 运行 `npm test`、`npm run check`；在真实页面刷新资料后运行 `npm run smoke`，逐项验证库存、说明状态、原文完整性和搜索正文一致性。
- 页面复查覆盖零诊断、修订说明与原文、原生宿主兼容技能检索、搜索及需求定义阶段筛选；执行结果另存本机证据。测试、页面读取和人工语义审读分别记录，不互相替代。
