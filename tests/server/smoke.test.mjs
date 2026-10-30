import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createApp} from '../../src/server/app.mjs';

const script=fileURLToPath(new URL('../../scripts/smoke.mjs',import.meta.url));
async function fixture(t){
 const work=await mkdtemp(path.join(tmpdir(),'reader-smoke-'));
 const root=path.join(work,'ecc'),noteFile=path.join(work,'data','learning-notes','ecc.json');
 await mkdir(path.join(root,'.codex-plugin'),{recursive:true});await mkdir(path.dirname(noteFile),{recursive:true});
 await writeFile(path.join(root,'.codex-plugin','plugin.json'),JSON.stringify({name:'ecc',version:'1.0.0',skills:'./skills'}));
 const notes=[];
 for(const slug of ['alpha','beta']){
  const raw=`---\nname: ${slug}\ndescription: Smoke fixture\n---\n# 原文\n\n完整正文 ${slug}\n`;
  const dir=path.join(root,'skills',slug);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'SKILL.md'),raw);
  notes.push({id:`ecc/native/${slug}`,callName:`ecc:${slug}`,nameZh:'示例技能',summaryZh:'中文用途说明',scenariosZh:['核对原文','检查用途'],tags:['测试'],category:'开发',version:'1.0.0',sourceHash:createHash('sha256').update(raw).digest('hex')});
 }
 await writeFile(noteFile,JSON.stringify(notes));
 const config={schema:1,sources:[{id:'ecc',label:'ECC',root,version:'1.0.0',entries:[{kind:'native',directory:'skills'}]}]};
 const configFile=path.join(work,'sources.json');await writeFile(configFile,JSON.stringify(config));
 const server=await createApp({config,notesFiles:[noteFile],webRoot:work});let requests=0;
 server.on('request',()=>requests++);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const children=[];
 const start=(port=server.address().port)=>{
  const child=spawn(process.execPath,[script],{cwd:work,env:{...process.env,SKILL_READER_CONFIG:configFile,SKILL_READER_PORT:String(port)},stdio:['ignore','pipe','pipe']});
  children.push(child);let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
  const exit=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal,stdout,stderr}));});
  return {child,exit};
 };
 const reportFile=path.join(work,'.local','acceptance','smoke.json');
 const report=async()=>JSON.parse(await readFile(reportFile,'utf8'));
 const seed=async()=>{await mkdir(path.dirname(reportFile),{recursive:true});await writeFile(reportFile,JSON.stringify({status:'passed',runId:'old-run',total:999}));};
 const proxy=async(handler)=>{
  const proxy=http.createServer(async(req,res)=>{
   if(await handler(req,res))return;
   try{const response=await fetch(`http://127.0.0.1:${server.address().port}${req.url}`);res.writeHead(response.status,{'Content-Type':'application/json'});res.end(await response.text());}catch{res.writeHead(503);res.end('{}');}
  });
  await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>proxy.close(resolve)));return proxy;
 };
 t.after(async()=>{for(const child of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await new Promise(resolve=>server.close(resolve));await rm(work,{recursive:true,force:true});});
 return {work,notes,noteFile,configFile,reportFile,report,seed,start,proxy,requests:()=>requests};
}

test('smoke success then failure replaces the old passed report and can recover',async t=>{
 const f=await fixture(t);
 assert.equal((await f.start().exit).code,0);const first=await f.report();
 await writeFile(f.noteFile,JSON.stringify(f.notes.map(n=>({...n,sourceHash:'0'.repeat(64)}))));
 assert.notEqual((await f.start().exit).code,0);const failed=await f.report();
 assert.equal(failed.status,'failed');assert.notEqual(failed.runId,first.runId);
 assert.equal(failed.total,f.notes.length);assert.equal(failed.stale,f.notes.length);assert.equal(failed.completeDetailsChecked,0);
 assert.ok(failed.startedAt&&failed.finishedAt);assert.equal(failed.error.stage,'catalog');
 await writeFile(f.noteFile,JSON.stringify(f.notes));assert.equal((await f.start().exit).code,0);
 const recovered=await f.report();assert.equal(recovered.status,'passed');assert.notEqual(recovered.runId,failed.runId);
 assert.equal(recovered.completeDetailsChecked,f.notes.length);
});

test('smoke config failure replaces old success without leaking the config path',async t=>{
 const f=await fixture(t);await f.seed();await writeFile(f.configFile,'{');
 const result=await f.start().exit;assert.notEqual(result.code,0);
 const report=await f.report();assert.equal(report.status,'failed');assert.notEqual(report.runId,'old-run');assert.equal(report.error.stage,'config');
 assert.equal(report.total,null);assert.equal(report.completeDetailsChecked,0);
 assert.ok(!JSON.stringify(report).includes(f.work));assert.ok(!result.stderr.includes(f.work));
});

test('smoke detail failure records only the completed progress',async t=>{
 const f=await fixture(t);let details=0;
 const proxy=await f.proxy((req,res)=>{
  if(req.url.startsWith('/api/skills/')&&++details===2){res.writeHead(503,{'Content-Type':'application/json'});res.end('{}');return true;}return false;
 });
 const result=await f.start(proxy.address().port).exit;assert.notEqual(result.code,0);
 const report=await f.report();assert.equal(report.status,'failed');assert.equal(report.error.stage,'details');
 assert.equal(report.completeDetailsChecked,f.notes.length-1);assert.equal(report.total,f.notes.length);
});

test('smoke publishes running before requests and rejects concurrent overwrite',{timeout:10000},async t=>{
 const f=await fixture(t);await f.seed();let release,received;
 const gate=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>received=resolve);
 const proxy=await f.proxy(async req=>{if(req.url==='/api/skills'){received();await gate;}return false;});
 const first=f.start(proxy.address().port);
 try{
  await requested;const running=await f.report();assert.equal(running.status,'running');assert.notEqual(running.runId,'old-run');
  const second=f.start(proxy.address().port);
  let timeout;const rejected=await Promise.race([second.exit,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Concurrent smoke did not exit')),3000);})]).finally(()=>clearTimeout(timeout));
  assert.notEqual(rejected.code,0);assert.equal((await f.report()).runId,running.runId);assert.equal((await f.report()).status,'running');
 }finally{release();}
 assert.equal((await first.exit).code,0);assert.equal((await f.report()).status,'passed');
});

test('hard interrupted smoke leaves its own incomplete report instead of old success',{timeout:10000},async t=>{
 const f=await fixture(t);await f.seed();let release,received;
 const gate=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>received=resolve);
 const proxy=await f.proxy(async req=>{if(req.url==='/api/skills'){received();await gate;}return false;});
 const run=f.start(proxy.address().port);
 try{await requested;run.child.kill('SIGKILL');await run.exit;const report=await f.report();assert.equal(report.status,'running');assert.notEqual(report.runId,'old-run');}
 finally{release();}
});

test('smoke refuses an unwritable report before touching the API',async t=>{
 const f=await fixture(t);await mkdir(f.reportFile,{recursive:true});
 const result=await f.start().exit;assert.notEqual(result.code,0);assert.equal(f.requests(),0);assert.match(result.stderr,/报告/);
});

test('smoke connection failure is a new failed result',async t=>{
 const f=await fixture(t);await f.seed();const dead=http.createServer();await new Promise(resolve=>dead.listen(0,'127.0.0.1',resolve));
 const port=dead.address().port;await new Promise(resolve=>dead.close(resolve));
 const result=await f.start(port).exit;assert.notEqual(result.code,0);const report=await f.report();
 assert.equal(report.status,'failed');assert.notEqual(report.runId,'old-run');assert.equal(report.error.stage,'catalog');
});
