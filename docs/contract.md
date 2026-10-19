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
sourceHash 是完整 SKILL.md UTF-8 文件字节的 SHA-256。public ECC 笔记文件是 `data/learning-notes/ecc.json`，Cyto 是 `.local/learning-notes/cyto.json`，配置目录由启动器确定，不随请求指定。

GET `/api/skills` 响应：

```json
{
  "schema":1,
  "sources":[{"id":"ecc","label":"ECC","version":"2.2.3","count":1}],
  "skills":[{
    "id":"ecc/native/example","provider":"ecc","providerLabel":"ECC",
    "kind":"native","slug":"example","version":"2.2.3",
    "callName":"ecc:example","description":"Original description",
    "sourceHash":"<sha256>","nameZh":"示例","summaryZh":"用途说明",
    "scenariosZh":["使用场景"],"tags":["技能管理"],"category":"技能与上下文管理",
    "status":"verified"
  }],
  "diagnostics":[{"source":"ecc","code":"EXAMPLE","message":"安全且不含绝对路径的中文说明"}]
}
```

状态 verified / missing / stale，分别为版本/hash匹配、无中文笔记、来源变化。无中文时字段为空、数组为空，UI显示待整理。
GET `/api/skills/${encodeURIComponent(id)}`：上述单条字段加 `body`（完整正文，不含 frontmatter）、`references:[{id,label}]`。
GET `/api/references/${encodeURIComponent(id)}`：服务器登记过的包内 Markdown 引用，返回 `{title,body,references}`。不直接暴露文件路径，不跟随远程图片。
失败返回 `{error:"中文说明",code:"NOT_FOUND"}`，状态符合 HTTP，不含堆栈/宿主路径。只接受 GET/HEAD。

前端入口是 `web/index.html`，客户端构建入口 `web/app.mjs`。构建输出到 `dist/`（index.html、app.js、app.css）；本地 esbuild 将 marked 和 DOMPurify 一起打包，运行无需 CDN。静态资源严格映射，不暴露项目树。

UI 筛选状态 `{provider:"",category:"",query:"",tags:[]}`，标签 AND，与其他条件 AND。切换 provider 清 category；全技能清 provider/category；clear 清所有。库存不随筛选变化。

最小脚本：`npm run build` 构建前端，`npm start` 启动读取本地配置的服务，环境变量 `SKILL_READER_CONFIG` / `SKILL_READER_PORT` 可覆盖配置文件/端口。默认回环3457，不读3456 API。

后端对外供测试的工厂：`createApp({config, notesFiles=[], webRoot}) -> Promise<http.Server>`，由调用者 `.listen(0,'127.0.0.1')`。Host/Origin 检查按实际 server.address().port。配置读取与监听在 start.mjs，import 工厂不得启动服务。

实施分工：后端维护 src/server 与 tests/server，前端维护 web 与 tests/web；package/lock、scripts、docs、data 和 E2E 由集成人维护。
