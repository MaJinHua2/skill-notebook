import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,open,rename,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

const reportDir=path.resolve('.local/acceptance');
const reportFile=path.join(reportDir,'smoke.json'),lockFile=path.join(reportDir,'smoke.lock');
const report={runId:randomUUID(),status:'running',startedAt:new Date().toISOString(),finishedAt:null,stage:'starting',inventory:null,total:null,verified:null,missing:null,stale:null,diagnostics:null,completeDetailsChecked:0,longestBodyCharacters:null};
const temporary=path.join(reportDir,`smoke.${report.runId}.tmp`);
let failureMessage='资料检查无法完成';
async function publish(){
 try{await writeFile(temporary,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});await rename(temporary,reportFile);}
 finally{await unlink(temporary).catch(()=>{});}
}
async function inspect(){
 report.stage='config';failureMessage='来源配置无法读取或格式不正确';
 const config=JSON.parse(await readFile(process.env.SKILL_READER_CONFIG||'.local/sources.json','utf8'));
 const base=`http://127.0.0.1:${process.env.SKILL_READER_PORT||3457}`;
 report.stage='catalog';failureMessage='无法读取有效的技能库存';
 const response=await fetch(base+'/api/skills');assert.equal(response.status,200);
 const catalog=await response.json();
 assert.ok(Array.isArray(catalog.skills)&&Array.isArray(catalog.sources)&&Array.isArray(catalog.diagnostics));
 Object.assign(report,{inventory:catalog.sources.map(({id,count})=>({id,count})),total:catalog.skills.length,verified:catalog.skills.filter(s=>s.status==='verified').length,missing:catalog.skills.filter(s=>s.status==='missing').length,stale:catalog.skills.filter(s=>s.status==='stale').length,diagnostics:catalog.diagnostics.length});
 failureMessage='真实来源存在待复核说明或其他校验诊断';assert.equal(catalog.diagnostics.length,0);
 failureMessage='技能库存含重复 ID 或非批准来源';
 assert.equal(new Set(catalog.skills.map(s=>s.id)).size,catalog.skills.length);assert.deepEqual(catalog.sources.map(s=>s.id),['ecc']);
 report.stage='notes';failureMessage='中文说明无法读取或未完整对应实际库存';
 const notes=JSON.parse(await readFile('data/learning-notes/ecc.json','utf8'));
 assert.deepEqual(catalog.skills.map(s=>s.id).sort(),notes.map(n=>n.id).sort());
 report.stage='source-inventory';failureMessage='批准来源不可读或与 API 库存不一致';
 const sourceIds=[];
 for(const source of config.sources)for(const entry of source.entries){
  for(const child of await readdir(path.join(source.root,entry.directory),{withFileTypes:true})){
   if(!child.isDirectory())continue;
   await readFile(path.join(source.root,entry.directory,child.name,'SKILL.md'));
   sourceIds.push(`${source.id}/${entry.kind}/${child.name}`);
  }
 }
 assert.deepEqual(catalog.skills.map(s=>s.id).sort(),sourceIds.sort());
 report.stage='details';
 for(const skill of catalog.skills){
  report.currentSkillId=skill.id;failureMessage='技能说明未核对或中文字段不完整';
  assert.equal(skill.status,'verified');assert.ok(skill.nameZh&&skill.summaryZh&&skill.scenariosZh.length>=2);
  const source=config.sources.find(s=>s.id===skill.provider),entry=source.entries.find(e=>e.kind===skill.kind);
  assert.equal(skill.callName,`ecc:${skill.slug}`);
  failureMessage='技能来源不可读或摘要已变化';
  const raw=await readFile(path.join(source.root,entry.directory,skill.slug,'SKILL.md'));
  assert.equal(createHash('sha256').update(raw).digest('hex'),skill.sourceHash);
  failureMessage='技能详情无法读取或与来源正文不一致';
  const detailResponse=await fetch(base+'/api/skills/'+encodeURIComponent(skill.id));assert.equal(detailResponse.status,200);
  const detail=await detailResponse.json(),sourceText=raw.toString('utf8');
  const header=/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(sourceText);
  assert.ok(header);assert.equal(detail.body,sourceText.slice(header[0].length));
  assert.equal(skill.searchText,detail.body);assert.equal(detail.callName,skill.callName);
  report.completeDetailsChecked++;report.longestBodyCharacters=Math.max(report.longestBodyCharacters??0,detail.body.length);
 }
 delete report.currentSkillId;report.stage='complete';
}
async function main(){
 let lock;
 try{
  await mkdir(reportDir,{recursive:true});lock=await open(lockFile,'wx',0o600);
  await lock.writeFile(JSON.stringify({runId:report.runId,pid:process.pid,startedAt:report.startedAt})+'\n');
  await publish();
 }catch(error){
  console.error(!lock&&error.code==='EEXIST'?'已有资料检查运行占用，本次未启动；请核对原运行状态。':'本轮报告无法写入，旧报告不能作为本次结果。');
  process.exitCode=1;
  if(lock){await lock.close().catch(()=>{});await unlink(lockFile).catch(()=>{});}
  return;
 }
 try{
  try{await inspect();report.status='passed';}
  catch{report.status='failed';report.error={stage:report.stage,message:failureMessage};process.exitCode=1;console.error(`资料检查失败（${report.stage}）：${failureMessage}`);}
  report.finishedAt=new Date().toISOString();
  try{await publish();console.log(JSON.stringify(report,null,2));}
  catch{process.exitCode=1;console.error('本轮报告无法写入，旧报告不能作为本次结果。');}
 }finally{
  await lock.close().catch(()=>{});
  await unlink(lockFile).catch(()=>{process.exitCode=1;console.error('资料检查运行占用未能清理，请核对运行状态后处理。');});
 }
}
await main();
