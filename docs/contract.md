# 阅读器实现契约 v1

此文件是接口与界面的共同输入。仅在独立项目实现；ECC 和插件目录只读。

本地配置（不提交）：`.local/sources.json`。

```json
{
  "schema": 1,
  "sources": [{
    "id": "ecc", "label": "ECC", "root": "<absolute-package-root>",
    "version": "2.2.3",
    "entries": [
      {"kind": "native", "directory": "skills"},
      {"kind": "migrated", "directory": ".codex-plugin/migrated-command-skills"}
    ]
  }]
}
```

包元数据固定读 `.codex-plugin/plugin.json` 中 name/version/skills，不返回其余作者资料。
技能 ID 为 `${source.id}/${entry.kind}/${slug}`，前端用 encodeURIComponent 放入单一路由段。
callName 由 `${source.id}:${frontmatter.name}` 得到，name 必须与技能目录相同，否则诊断拒绝。

学习笔记是 JSON 数组。每项含 `id, callName, nameZh, summaryZh, scenariosZh: string[], tags: string[], category, version, sourceHash`。
sourceHash 是完整 SKILL.md UTF-8 文件字节的 SHA-256。当前仅维护 ECC，笔记文件是 `data/learning-notes/ecc.json`，共 348 项；配置目录由启动器确定，不随请求指定。本机与后续 Sites 数据范围均只包含 ECC。

GET `/api/skills` 响应：

```json
{
  "schema":1,
  "sources":[{"id":"ecc","label":"ECC","version":"2.2.3","count":1}],
  "skills":[{
    "id":"ecc/native/example","provider":"ecc","providerLabel":"ECC",
    "kind":"native","slug":"example","version":"2.2.3",
    "callName":"ecc:example","description":"Original description","searchText":"Complete original SKILL.md body",
    "sourceHash":"<sha256>","nameZh":"示例","summaryZh":"用途说明",
    "scenariosZh":["使用场景"],"tags":["技能管理"],"category":"技能与上下文管理",
    "status":"verified"
  }],
  "diagnostics":[{"source":"ecc","code":"EXAMPLE","message":"安全且不含绝对路径的中文说明"}]
}
```

状态 verified / missing / stale，分别为版本/hash匹配、无中文笔记、来源变化。无中文时字段为空、数组为空，UI显示待整理。
`description` 保留英文简介，`searchText` 保留通过来源校验的完整技能正文（不含 frontmatter）。两者参与搜索但不显示在列表；它们是可下发的检索数据，不是保密字段。搜索不包含关联文档内容。详情仍显示原文；资料刷新同时替换正文检索快照。
GET `/api/skills/${encodeURIComponent(id)}`：上述单条字段加 `body`（完整正文，不含 frontmatter）、`references:[{id,label}]`。
GET `/api/references/${encodeURIComponent(id)}`：服务器登记过的包内 Markdown 引用，返回 `{title,body,references}`。不直接暴露文件路径，不跟随远程图片。
失败返回 `{error:"中文说明",code:"NOT_FOUND"}`，状态符合 HTTP，不含堆栈/宿主路径。只接受 GET/HEAD。

前端入口是 `web/index.html`，客户端构建入口 `web/app.mjs`。构建输出到 `dist/`（index.html、app.js、app.css）；本地 esbuild 将 marked 和 DOMPurify 一起打包，运行无需 CDN。静态资源严格映射，不暴露项目树。

指南接入补充（2026-10-30）：`#/guides/multi-agent-development` 显示“多智能体开发全流程”板块。`web/guides/multi-agent-development/` 保存用户提供 HTML 的接入副本，原内联样式和脚本分别拆为 `guide.css` 和 `guide.js`；构建复制三项资源到同名 `dist/` 子目录。服务器仅增加这三个精确资源路径，只有成功返回的指南 HTML 使用 `frame-ancestors 'self'`，其他响应仍为 `'none'`。指南通过同源 iframe 隔离样式和章节锚点，保持原稿搜索、筛选和复制行为；技能列表筛选继续由阅读器管理。需求与完成条件见 `PRODUCT-BRIEF.md`。

UI 筛选状态 `{provider:"",category:"",query:"",tags:[]}`，标签 AND，与其他条件 AND。切换 provider 清 category；全技能清 provider/category；clear 清所有。库存不随筛选变化。

每张卡片在标签下方提供“查看详情与原文”原生链接，与标题使用相同的 skills 路由，不拦截浏览器原生新标签页操作。支持键盘和至少 44px 高的点击区域；返回列表保留筛选条件，列表本身不显示原文。

查询先做 Unicode NFKC、英文小写和空白归一，再按空白拆词去重，所有词均须命中，但可命中不同字段。每词按最高命中字段计分：调用名／目录名／中文名 100，标签／分类 60，中英文简介／场景 30，原文正文 10。总分降序，同分保留库存顺序；空查询保留原顺序。支持字面子串，并按完整英文词识别显式词形组 orchestration、orchestrate、orchestrates、orchestrated、orchestrating、orchestrator、orchestrators，不扩展中文同义词。

最小脚本：`npm run build` 构建前端，`npm start` 启动读取本地配置的服务，环境变量 `SKILL_READER_CONFIG` / `SKILL_READER_PORT` 可覆盖配置文件/端口。默认回环3457，不读3456 API。`SKILL_READER_HOST` 支持 `127.0.0.1` 或 `0.0.0.0`；后者必须显式配置 `SKILL_READER_ALLOWED_CIDRS`（逗号分隔的 IPv4 CIDR，前缀 1–32）。实际局域网网段仅保存在本机私有配置。

后端对外供测试的工厂：`createApp({config, notesFiles=[], webRoot, allowedCidrs=[]}) -> Promise<http.Server>`，由调用者 `.listen(0,'127.0.0.1')`。默认只允许回环客户端；网段按真实 socket 地址检查，忽略代理头。Host 使用实际监听端口与允许网段内的本机网卡 IPv4 地址，Origin 须同源。配置读取与监听在 start.mjs，import 工厂不得启动服务。

实施分工：后端维护 src/server 与 tests/server，前端维护 web 与 tests/web；package/lock、scripts、docs、data 和 E2E 由集成人维护。
