# 技能拾记 · Skill Notebook

一份可在本地和局域网查阅的公开技能学习笔记。关注四件事：**技能调用名、技能中文名、技能概括、技能使用场景**。

支持全文搜索、场景分类、插件筛选、调用名复制，以及使用边界说明。电脑使用列表，手机使用卡片。免登录、只读浏览，不记录学习进度，也不定时采集。

## 快速运行

需要 Python 3.10 或更高版本，无第三方运行依赖。在项目根目录运行：

```bash
python3 server.py
```

打开 <http://127.0.0.1:8765>。默认监听 `0.0.0.0:8765`，同一局域网的其他设备可以使用主机的局域网地址访问；本项目不配置公网转发。

## 安装为本地服务

Linux systemd 用户会话中运行：

```bash
python3 scripts/install_local.py
```

安装程序从模板生成用户服务，并将仓库内的 `collect-skill-notes` 技能链接到 Codex 技能目录。个人路径仅出现在本机生成的配置中。若同名技能属于其他位置，安装程序停止，不覆盖已有内容。

```bash
systemctl --user status skill-notebook
systemctl --user restart skill-notebook
systemctl --user stop skill-notebook
journalctl --user -u skill-notebook -n 40 --no-pager
```

自动启动随用户服务管理器运行；是否支持未登录时启动取决于系统的 linger 配置。本项目不自动更改该系统设置。取消自动启动：`systemctl --user disable --now skill-notebook`。

## 主动收录技能

在 Codex 中主动调用：

```text
使用 $collect-skill-notes，收录这次对话介绍的新技能，按调用名、中文名、概括和使用场景整理。
```

也可以明确提供其他对话链接。技能通过 Codex 原生接口读取介绍、整理用途，再由本地脚本更新资料。网页本身不连接 Codex，也不执行被介绍的技能。新安装的技能如果尚未出现在当前会话列表中，可以在新会话使用，或明确引用仓库内的 `skills/collect-skill-notes/SKILL.md`。

同一技能按完整调用名去重，不同场景合并；纠错可明确替换过时场景。完成后点击网页的“刷新资料”。中文名是便于理解的整理译名，不代表官方名称；技能介绍不证明执行效果。

## 公开笔记与私人来源

| 位置 | 内容 | 纳入 Git / 网页 |
|---|---|---|
| `public/catalog.json` | 四项核心信息、分类、插件归属和能力边界 | 是 |
| `.local/catalog.json` | 本机原始来源、对话与轮次标识 | 否 |
| `.local/` 中的临时输入 | 本次收录的原始整理数据 | 否 |
| `backups/` | 原始资料的历史备份 | 否 |
| `deploy/` | 可复用的服务模板 | 是 |

导入只按字段白名单导出公开笔记，并检查公开文本中的个人路径、地址、私人邮箱、对话标识及常见凭据。公开文件不包含原始对话来源表或精确活动时间。来源保留本地，网页仅显示整理后的学习内容。

```bash
python3 scripts/import_notes.py --input .local/batch.json
python3 scripts/import_notes.py --export
python3 scripts/import_notes.py --restore backups/catalog-BACKUP.json
```

输入格式见 [收录格式](skills/collect-skill-notes/references/catalog-format.md)。首次克隆没有私人来源文件，首次收录会保留已有公开笔记并建立本机资料。修改前备份、文件锁和原子替换保护数据；公开导出失败时可修正后重新执行 `--export`。备份也含私人来源，不能强制加入 Git。

## 项目管理与验证

```text
public/                       网页及公开学习笔记
scripts/                      收录、脱敏检查和本地安装
tests/                        数据、隐私与 HTTP 测试
skills/collect-skill-notes/    主动收录技能源文件
deploy/                       服务模板
.githooks/                    提交和推送前的公开内容检查
deploy/github-actions-check.yml  可选的 GitHub 自动验证模板
```

在自己的克隆中启用仓库钩子：

```bash
git config core.hooksPath .githooks
```

验证命令：

```bash
python3 -m unittest discover -s tests -v
node --check public/app.js
python3 scripts/check_public.py --staged --history
```

Node.js 只用于可选的 JavaScript 语法检查，网页运行不依赖它。隐私检查报告相对文件位置和问题类别，不输出匹配内容；它是发布辅助检查，不能代替对具体学习笔记的人工复核。测试数据使用合成标识，不引用真实对话。

GitHub Actions 模板位于 `deploy/github-actions-check.yml`。需要启用时，将其复制到 `.github/workflows/check.yml`；提交该路径需要相应的 GitHub 工作流写入权限。
