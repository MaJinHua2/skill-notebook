import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, unlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createApp } from '../../src/server/app.mjs';

const digest = text => createHash('sha256').update(text).digest('hex');
const skillText = (name='sample', body='完整正文') => `---\r\nname: ${name}\r\ndescription: >-\r\n  多行说明\r\n  正确解析\r\n---\r\n${body}`;

async function fixture(t) {
  const base = await mkdtemp(path.join(tmpdir(), 'skill-reader-test-'));
  t.after(() => rm(base, {recursive:true, force:true}));
  const root = path.join(base, 'package');
  const webRoot = path.join(base, 'dist');
  const outside = path.join(base, 'outside');
  await Promise.all([mkdir(path.join(root, '.codex-plugin'), {recursive:true}), mkdir(path.join(root,'skills','sample'),{recursive:true}), mkdir(webRoot), mkdir(outside)]);
  await writeFile(path.join(root,'.codex-plugin','plugin.json'), JSON.stringify({name:'ecc',version:'1.0.0',skills:'./skills',author:{email:'private@example.test'}}));
  await writeFile(path.join(root,'skills','sample','SKILL.md'), skillText());
  await Promise.all(['index.html','app.js','app.css'].map(name => writeFile(path.join(webRoot,name), name)));
  const source = {id:'ecc',label:'ECC',version:'1.0.0',root,entries:[{kind:'native',directory:'skills'}]};
  const config = {schema:1,sources:[source]};
  const serve = async (options={}) => {
    const server = await createApp({config,webRoot,...options});
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const port = server.address().port;
    const request = (url, headers={}, method='GET') => new Promise((resolve,reject)=> {
      const req = http.request({host:'127.0.0.1',port,path:url,method,headers}, response => {
        let body=''; response.setEncoding('utf8'); response.on('data',chunk=>body+=chunk);
        response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,body,json:()=>JSON.parse(body)}));
      }); req.on('error',reject); req.end();
    });
    return {request,port};
  };
  return {base,root,webRoot,outside,source,config,serve};
}

test('development guide serves only fixed local assets and allows only its HTML to be embedded',async t=>{
  const f=await fixture(t);const dir=path.join(f.webRoot,'guides','multi-agent-development');
  await mkdir(dir,{recursive:true});
  const files=[['index.html','<h1>流程指南</h1>','text/html'],['guide.css','body{color:green}','text/css'],['guide.js','document.title="流程指南"','text/javascript']];
  for(const [name,body] of files)await writeFile(path.join(dir,name),body);
  await writeFile(path.join(dir,'private.txt'),'不公开');
  const {request}=await f.serve();
  for(const [name,body,type] of files){
    const response=await request(`/guides/multi-agent-development/${name}`);
    assert.equal(response.status,200);assert.equal(response.body,body);
    assert.ok(response.headers['content-type'].startsWith(type));
    assert.match(response.headers['content-security-policy'],/script-src 'self'; style-src 'self'/);
    assert.doesNotMatch(response.headers['content-security-policy'],/unsafe-inline/);
    assert.ok(response.headers['content-security-policy'].includes(`frame-ancestors '${name==='index.html'?'self':'none'}'`));
  }
  assert.match((await request('/')).headers['content-security-policy'],/frame-ancestors 'none'/);
  const head=await request('/guides/multi-agent-development/index.html?preview=1',{},'HEAD');
  assert.equal(head.status,200);assert.equal(head.body,'');assert.match(head.headers['content-security-policy'],/frame-ancestors 'self'/);
  assert.equal((await request('/guides/multi-agent-development/private.txt')).status,404);
  assert.equal((await request('/guides/unknown/index.html')).status,404);
  assert.equal((await request('/guides/multi-agent-development/index.html',{'Host':'external.invalid'})).status,403);
  assert.equal((await request('/guides/multi-agent-development/index.html',{},'POST')).status,405);
  await unlink(path.join(dir,'index.html'));
  const missing=await request('/guides/multi-agent-development/index.html');
  assert.equal(missing.status,404);assert.match(missing.headers['content-security-policy'],/frame-ancestors 'none'/);
});

test('complete CRLF/multiline frontmatter, stable IDs, full body, no author/path leakage and zero source writes', async t => {
  const f = await fixture(t);
  const file = path.join(f.root,'skills','sample','SKILL.md');
  const body = '# 标题\n'+ '长正文'.repeat(1200);
  const raw = skillText('sample',body); await writeFile(file,raw);
  const before = await stat(file);
  const {request} = await f.serve();
  const list = (await request('/api/skills')).json();
  assert.equal(list.schema,1); assert.equal(list.skills.length,1);
  assert.equal(list.skills[0].id,'ecc/native/sample');
  assert.equal(list.skills[0].callName,'ecc:sample');
  assert.equal(list.skills[0].description,'多行说明 正确解析');
  assert.equal(list.skills[0].searchText,body);
  assert.equal(list.skills[0].sourceHash,digest(raw));
  assert.equal(list.skills[0].status,'missing');
  assert.equal(list.skills[0].nameZh,'');
  assert.equal(list.sources[0].count,1);
  assert.equal((await request('/api/skills/ecc%2Fnative%2Fsample')).json().body,body);
  assert.equal((await stat(file)).mtimeMs,before.mtimeMs);
  assert.equal(await readFile(file,'utf8'),raw);
  const serialized=JSON.stringify(list);
  assert.ok(!serialized.includes(f.base)); assert.ok(!serialized.includes('private@example'));
});

test('matching, missing and stale learning overlays use version/hash/callName', async t => {
  const f=await fixture(t); const noteFile=path.join(f.base,'notes.json');
  const raw=await readFile(path.join(f.root,'skills','sample','SKILL.md'),'utf8');
  const note={id:'ecc/native/sample',callName:'ecc:sample',nameZh:'示例',summaryZh:'中文用途',scenariosZh:['阅读'],tags:['学习'],category:'文档',version:'1.0.0',sourceHash:digest(raw)};
  await writeFile(noteFile,JSON.stringify([note]));
  let app=await f.serve({notesFiles:[noteFile]});
  let item=(await app.request('/api/skills')).json().skills[0];
  assert.equal(item.status,'verified'); assert.equal(item.nameZh,'示例');
  await writeFile(noteFile,JSON.stringify([{...note,sourceHash:'0'.repeat(64)}]));
  app=await f.serve({notesFiles:[noteFile]}); item=(await app.request('/api/skills')).json().skills[0];
  assert.equal(item.status,'stale'); assert.equal(item.summaryZh,'中文用途');
  await writeFile(noteFile,JSON.stringify([{...note,callName:'ecc:wrong'}]));
  app=await f.serve({notesFiles:[noteFile]});
  const list=(await app.request('/api/skills')).json();
  assert.equal(list.skills[0].status,'missing'); assert.ok(list.diagnostics.length);
});

test('metadata/version, malformed YAML and mismatched invocation names produce safe diagnostics', async t => {
  const f=await fixture(t);
  for(const [slug,raw] of [['bad-yaml','---\nname: [broken\n---\nbody'],['wrong-name',skillText('other')]]) {
    await mkdir(path.join(f.root,'skills',slug)); await writeFile(path.join(f.root,'skills',slug,'SKILL.md'),raw);
  }
  let app=await f.serve(); let list=(await app.request('/api/skills')).json();
  assert.equal(list.skills.length,1); assert.equal(list.diagnostics.length,2);
  app=await f.serve({config:{schema:1,sources:[{...f.source,version:'2.0.0'}]}});
  list=(await app.request('/api/skills')).json(); assert.equal(list.skills.length,0); assert.ok(list.diagnostics.length);
  assert.ok(!JSON.stringify(list).includes(f.base));
  await writeFile(path.join(f.root,'.codex-plugin','plugin.json'),JSON.stringify({name:'imposter',version:'1.0.0',skills:'./skills'}));
  app=await f.serve(); list=(await app.request('/api/skills')).json();
  assert.equal(list.skills.length,0); assert.ok(list.diagnostics.length);
});

test('duplicate real package is deduplicated; conflicts rejected; same slug across packages retained', async t => {
  const f=await fixture(t);
  const duplicate={...f.source,root:path.join(f.root,'.')};
  let app=await f.serve({config:{schema:1,sources:[f.source,duplicate]}});
  assert.equal((await app.request('/api/skills')).json().skills.length,1);
  await assert.rejects(createApp({config:{schema:1,sources:[f.source,{...duplicate,version:'9'}]},webRoot:f.webRoot}),error=>!error.message.includes(f.base));
  const root2=path.join(f.base,'cyto');
  await mkdir(path.join(root2,'.codex-plugin'),{recursive:true}); await mkdir(path.join(root2,'skills','sample'),{recursive:true});
  await writeFile(path.join(root2,'.codex-plugin','plugin.json'),JSON.stringify({name:'cyto',version:'1.0.0',skills:'./skills'}));
  await writeFile(path.join(root2,'skills','sample','SKILL.md'),skillText());
  app=await f.serve({config:{schema:1,sources:[f.source,{...f.source,id:'cyto',label:'Cyto',root:root2}]}});
  assert.deepEqual((await app.request('/api/skills')).json().skills.map(x=>x.callName),['ecc:sample','cyto:sample']);
});

test('entry/skill/file symlinks outside approved boundaries are rejected', async t => {
  for(const layer of ['entry','skill','file']) {
    const f=await fixture(t);
    await writeFile(path.join(f.outside,'SKILL.md'),skillText());
    if(layer==='entry') { await rm(path.join(f.root,'skills'),{recursive:true}); await symlink(f.outside,path.join(f.root,'skills')); }
    if(layer==='skill') { await rm(path.join(f.root,'skills','sample'),{recursive:true}); await symlink(f.outside,path.join(f.root,'skills','sample')); }
    if(layer==='file') { await unlink(path.join(f.root,'skills','sample','SKILL.md')); await symlink(path.join(f.outside,'SKILL.md'),path.join(f.root,'skills','sample','SKILL.md')); }
    const {request}=await f.serve(); const list=(await request('/api/skills')).json();
    assert.equal(list.skills.length,0,layer); assert.ok(list.diagnostics.length,layer);
    assert.ok(!JSON.stringify(list).includes(f.base));
  }
});

test('source file swapped after discovery refuses detail reading', async t => {
  const f=await fixture(t); const {request}=await f.serve();
  const file=path.join(f.root,'skills','sample','SKILL.md'); await unlink(file);
  await writeFile(path.join(f.outside,'secret.md'),'secret outside'); await symlink(path.join(f.outside,'secret.md'),file);
  const result=await request('/api/skills/ecc%2Fnative%2Fsample');
  assert.equal(result.status,404); assert.ok(!result.body.includes('secret outside')); assert.ok(!result.body.includes(f.base));
});

test('registered opaque Markdown references only; traversal, encoded paths and symlink escapes blocked', async t => {
  const f=await fixture(t); const dir=path.join(f.root,'skills','sample');
  await writeFile(path.join(dir,'guide.md'),'# 指南\n完整引用');
  await writeFile(path.join(f.outside,'secret.md'),'private'); await symlink(path.join(f.outside,'secret.md'),path.join(dir,'escape.md'));
  await writeFile(path.join(dir,'SKILL.md'),skillText('sample','[指南](guide.md) [逃逸](escape.md) [遍历](../secret.md) [编码](%2e%2e%2fsecret.md) [外部](https://example.test/a.md) ![远程图片](https://example.test/a.png)'));
  const {request}=await f.serve(); const detail=(await request('/api/skills/ecc%2Fnative%2Fsample')).json();
  assert.equal(detail.references.length,1); assert.equal(detail.references[0].label,'指南');
  const id=detail.references[0].id; assert.match(id,/^[a-zA-Z0-9_-]+$/);
  const ref=(await request('/api/references/'+id)).json(); assert.equal(ref.body,'# 指南\n完整引用');
  await unlink(path.join(dir,'guide.md')); await symlink(path.join(f.outside,'secret.md'),path.join(dir,'guide.md'));
  assert.equal((await request('/api/references/'+id)).status,404);
  for(const url of ['/api/references/%2e%2e%2fsecret.md','/api/skills/%252e%252e','/.local/sources.json','/.git/config','/src/server/app.mjs','/node_modules/yaml/package.json']) {
    const result=await request(url); assert.equal(result.status,404,url); assert.ok(!result.body.includes(f.base));
  }
});

test('GET/HEAD only, actual-port Host and same Origin checks; static whitelist', async t => {
  const f=await fixture(t); const {request,port}=await f.serve();
  for(const method of ['POST','PUT','DELETE','PATCH','OPTIONS']) {
    const result=await request('/api/skills',{},method); assert.equal(result.status,405); assert.equal(result.headers.allow,'GET, HEAD');
  }
  assert.equal((await request('/api/skills',{},'HEAD')).body,'');
  for(const host of ['attacker.test:'+port,'127.0.0.1:3456','localhost','127.0.0.1:'+port+'.attacker.test']) assert.equal((await request('/api/skills',{Host:host})).status,403,host);
  assert.equal((await request('/api/skills',{Host:'localhost:'+port,Origin:'http://localhost:'+port})).status,200);
  for(const origin of ['http://attacker.test','http://127.0.0.1:3456','null','https://127.0.0.1:'+port]) assert.equal((await request('/api/skills',{Origin:origin})).status,403,origin);
  for(const url of ['/','/index.html','/app.js','/app.css']) assert.equal((await request(url)).status,200,url);
});

test('oversized source is diagnosed without exposing file data', async t => {
  const f=await fixture(t);
  await writeFile(path.join(f.root,'skills','sample','SKILL.md'),skillText('sample','x'.repeat(2*1024*1024+1)));
  const {request}=await f.serve(); const list=(await request('/api/skills')).json();
  assert.equal(list.skills.length,0); assert.ok(list.diagnostics.some(x=>x.code==='FILE_TOO_LARGE'));
});

test('UTF-8 BOM is included in the exact-byte hash and not included in the rendered body', async t => {
  const f=await fixture(t); const raw='\uFEFF'+skillText();
  await writeFile(path.join(f.root,'skills','sample','SKILL.md'),raw);
  const {request}=await f.serve(); const list=(await request('/api/skills')).json();
  assert.equal(list.skills[0].sourceHash,digest(raw));
  assert.equal((await request('/api/skills/ecc%2Fnative%2Fsample')).json().body,'完整正文');
});

test('directory links swapped after discovery are rechecked via the configured path', async t => {
  const f=await fixture(t); const linked=path.join(f.root,'skills','sample');
  const original=path.join(f.root,'skills','real-sample');
  await mkdir(original); await writeFile(path.join(original,'SKILL.md'),skillText());
  await rm(linked,{recursive:true}); await symlink(original,linked);
  const {request}=await f.serve();
  assert.equal((await request('/api/skills/ecc%2Fnative%2Fsample')).status,200);
  await unlink(linked); await writeFile(path.join(f.outside,'SKILL.md'),'outside'); await symlink(f.outside,linked);
  assert.equal((await request('/api/skills/ecc%2Fnative%2Fsample')).status,404);
});

test('nested registered references work; metadata/static symlink escapes and duplicate/orphan notes are diagnosed', async t => {
  const f=await fixture(t); const dir=path.join(f.root,'skills','sample');
  await writeFile(path.join(dir,'SKILL.md'),skillText('sample','[指南](guide.md)'));
  await writeFile(path.join(dir,'guide.md'),'# 指南\n[更深文档](deep.md)'); await writeFile(path.join(dir,'deep.md'),'# 更深文档\n内容');
  const notesFile=path.join(f.base,'notes.json');
  const note={id:'ecc/native/sample',callName:'ecc:sample',nameZh:'示例',summaryZh:'中文用途',scenariosZh:['阅读'],tags:['学习'],category:'文档',version:'1.0.0',sourceHash:'0'.repeat(64)};
  await writeFile(notesFile,JSON.stringify([note,note,{...note,id:'ecc/native/absent'}]));
  const {request}=await f.serve({notesFiles:[notesFile]});
  const list=(await request('/api/skills')).json(); assert.equal(list.skills[0].status,'missing');
  assert.ok(list.diagnostics.some(x=>x.code==='NOTE_DUPLICATE')); assert.ok(list.diagnostics.some(x=>x.code==='NOTE_ORPHAN'));
  const detail=(await request('/api/skills/ecc%2Fnative%2Fsample')).json();
  const guide=(await request('/api/references/'+detail.references[0].id)).json();
  assert.equal((await request('/api/references/'+guide.references[0].id)).json().body,'# 更深文档\n内容');
  await writeFile(path.join(f.outside,'private.js'),'private'); await unlink(path.join(f.webRoot,'app.js')); await symlink(path.join(f.outside,'private.js'),path.join(f.webRoot,'app.js'));
  const response=await request('/app.js'); assert.equal(response.status,404); assert.ok(!response.body.includes('private'));
  const metadata=path.join(f.root,'.codex-plugin','plugin.json'); const content=await readFile(metadata,'utf8');
  await writeFile(path.join(f.outside,'plugin.json'),content); await unlink(metadata); await symlink(path.join(f.outside,'plugin.json'),metadata);
  const app=await f.serve(); assert.equal((await app.request('/api/skills')).json().skills.length,0);
});

test('changed skill bytes refuse a stale detail rather than combining old annotations and new instructions', async t => {
  const f=await fixture(t); const {request}=await f.serve();
  await writeFile(path.join(f.root,'skills','sample','SKILL.md'),skillText('sample','新的正文'));
  const response=await request('/api/skills/ecc%2Fnative%2Fsample');
  assert.equal(response.status,404); assert.equal(response.json().code,'NOT_FOUND');
});

test('explicit list refresh rereads skill and overlay snapshots without stale verified status', async t => {
  const f=await fixture(t); const file=path.join(f.root,'skills','sample','SKILL.md');
  const notesFile=path.join(f.base,'notes.json');
  const note={id:'ecc/native/sample',callName:'ecc:sample',nameZh:'原说明',summaryZh:'中文用途',scenariosZh:['阅读'],tags:['学习'],category:'文档',version:'1.0.0',sourceHash:digest(await readFile(file,'utf8'))};
  await writeFile(notesFile,JSON.stringify([note]));
  const {request}=await f.serve({notesFiles:[notesFile]});
  assert.equal((await request('/api/skills')).json().skills[0].status,'verified');
  const changed=skillText('sample','更新后的完整正文'); await writeFile(file,changed);
  let list=(await request('/api/skills')).json();
  assert.equal(list.skills[0].status,'stale'); assert.equal(list.skills[0].sourceHash,digest(changed));
  assert.equal(list.skills[0].searchText,'更新后的完整正文');
  assert.equal((await request('/api/skills/ecc%2Fnative%2Fsample')).json().body,'更新后的完整正文');
  await writeFile(notesFile,JSON.stringify([{...note,nameZh:'更新说明',sourceHash:digest(changed)}]));
  list=(await request('/api/skills')).json();
  assert.equal(list.skills[0].status,'verified'); assert.equal(list.skills[0].nameZh,'更新说明');
  await unlink(notesFile);
  assert.equal((await request('/api/skills')).json().skills[0].status,'missing');
});

test('metadata mutation refuses details immediately and refresh rebuilds diagnostics while keeping valid references', async t => {
  const f=await fixture(t); const dir=path.join(f.root,'skills','sample');
  await writeFile(path.join(dir,'SKILL.md'),skillText('sample','[指南](guide.md)'));
  await writeFile(path.join(dir,'guide.md'),'# 保留的指南');
  const {request}=await f.serve();
  const detail=(await request('/api/skills/ecc%2Fnative%2Fsample')).json();
  const refUrl='/api/references/'+detail.references[0].id;
  await request('/api/skills'); assert.equal((await request(refUrl)).status,200);
  const metadata=path.join(f.root,'.codex-plugin','plugin.json');
  await writeFile(metadata,JSON.stringify({name:'ecc',version:'2.0.0',skills:'./skills'}));
  assert.equal((await request('/api/skills/ecc%2Fnative%2Fsample')).status,404);
  assert.equal((await request(refUrl)).status,404);
  const list=(await request('/api/skills')).json();
  assert.equal(list.skills.length,0); assert.ok(list.diagnostics.some(x=>x.code==='METADATA_MISMATCH'));
  await writeFile(metadata,JSON.stringify({name:'ecc',version:'1.0.0',skills:'./skills'}));
  assert.equal((await request('/api/skills')).json().skills.length,1);
  assert.equal((await request(refUrl)).status,200);
});
