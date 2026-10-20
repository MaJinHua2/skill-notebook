import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const config=JSON.parse(await readFile(process.env.SKILL_READER_CONFIG||'.local/sources.json','utf8'));
const base=`http://127.0.0.1:${process.env.SKILL_READER_PORT||3457}`;
const response=await fetch(base+'/api/skills');assert.equal(response.status,200);
const catalog=await response.json();
assert.equal(catalog.diagnostics.length,0,'真实来源应无校验诊断');
assert.equal(new Set(catalog.skills.map(s=>s.id)).size,catalog.skills.length);
let checked=0;
const bodyLengths=[];
for(const skill of catalog.skills) {
 assert.equal(skill.status,'verified',`${skill.id} 学习说明应与当前来源匹配`);
 assert.ok(skill.nameZh&&skill.summaryZh&&skill.scenariosZh.length>=2,skill.id);
 const source=config.sources.find(s=>s.id===skill.provider);
 const entry=source.entries.find(e=>e.kind===skill.kind);
 const raw=await readFile(path.join(source.root,entry.directory,skill.slug,'SKILL.md'));
 assert.equal(createHash('sha256').update(raw).digest('hex'),skill.sourceHash);
 const detailResponse=await fetch(base+'/api/skills/'+encodeURIComponent(skill.id));assert.equal(detailResponse.status,200);
 const detail=await detailResponse.json();
 const sourceText=raw.toString('utf8');
 const header=/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(sourceText);
 assert.ok(header,skill.id);assert.equal(detail.body,sourceText.slice(header[0].length),`${skill.id} 正文完整`);
 assert.equal(skill.searchText,detail.body,`${skill.id} 检索正文与详情一致`);
 assert.equal(detail.callName,skill.callName);
 bodyLengths.push(detail.body.length);checked++;
}
const result={status:'passed',inventory:catalog.sources.map(({id,count})=>({id,count})),total:catalog.skills.length,verified:catalog.skills.filter(s=>s.status==='verified').length,missing:catalog.skills.filter(s=>s.status==='missing').length,stale:catalog.skills.filter(s=>s.status==='stale').length,diagnostics:catalog.diagnostics.length,completeDetailsChecked:checked,longestBodyCharacters:Math.max(...bodyLengths)};
await mkdir('.local/acceptance',{recursive:true});
await writeFile('.local/acceptance/smoke.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
