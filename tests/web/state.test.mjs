import test from 'node:test';
import assert from 'node:assert/strict';
import {filterSkills, inventory, normalizeState, selectProvider, toggleTag, clearState, parseRoute, routeFor, toggleStage, workflowStage, WORKFLOWS} from '../../web/state.mjs';
const skills = [
{id:'ecc/native/a',provider:'ecc',category:'开发',callName:'ecc:a',nameZh:'架构',summaryZh:'设计接口',scenariosZh:['建立服务'],description:'Architecture',tags:['设计','接口']},
{id:'ecc/migrated/b',provider:'ecc',category:'测试',callName:'ecc:b',nameZh:'回归',tags:['测试']},
{id:'cyto/native/a',provider:'cyto',category:'开发',callName:'cyto:a',nameZh:'上下文',tags:['设计']}
];
test('AND filters combine provider/category/search/all selected tags',()=>{
 assert.equal(filterSkills(skills,{stage:'',provider:'ecc',category:'开发',query:'architecture',tags:['设计','接口']}).length,1);
 assert.equal(filterSkills(skills,{stage:'',provider:'',category:'',query:'',tags:['设计','接口']}).length,1);
 assert.equal(filterSkills(skills,{stage:'',provider:'cyto',category:'开发',query:'',tags:['接口']}).length,0);
 assert.equal(filterSkills(skills,{query:'建立服务'}).length,1);
});
test('inventory stays independent and categories scoped by provider',()=>{
 assert.deepEqual(inventory(skills).map(x=>[x.provider,x.count,x.categories]),[['ecc',2,[{name:'测试',count:1},{name:'开发',count:1}]],['cyto',1,[{name:'开发',count:1}]]]);
});
test('provider selection clears category and preserves query and tags',()=>{
 assert.deepEqual(selectProvider({stage:'',provider:'ecc',category:'开发',query:'接口',tags:['设计']},'cyto'),{stage:'',provider:'cyto',category:'',query:'接口',tags:['设计']});
 assert.deepEqual(selectProvider({stage:'',category:'开发',query:'a',tags:['设计']},''),{stage:'',provider:'',category:'',query:'a',tags:['设计']});
});
test('normalize handles invalid and malicious persisted shape; no private fields',()=>{
 assert.deepEqual(normalizeState({stage:'',provider:'absent',category:'开发',query:'x',tags:['设计','不存在','设计'],body:'secret'},skills),{stage:'',provider:'',category:'',query:'x',tags:['设计']});
 assert.deepEqual(normalizeState({stage:'',provider:'ecc',category:'不存在',query:5,tags:'设计'},skills),{stage:'',provider:'ecc',category:'',query:'',tags:[]});
 assert.deepEqual(normalizeState(null,skills),clearState());
});
test('tags toggle and all clear',()=>{
 assert.deepEqual(toggleTag({tags:['设计']},'接口').tags,['设计','接口']);
 assert.deepEqual(toggleTag({tags:['设计','接口']},'设计').tags,['接口']);
 assert.deepEqual(clearState(),{stage:'',provider:'',category:'',query:'',tags:[]});
});
test('ECC-only inventory drops removed provider/category while keeping valid search and tags',()=>{
 const ecc=skills.filter(s=>s.provider==='ecc');
 assert.deepEqual(inventory(ecc).map(s=>[s.provider,s.count]),[['ecc',2]]);
 const restored=normalizeState({stage:'',provider:'cyto',category:'开发',query:'架构',tags:['设计','removed']},ecc);
 assert.deepEqual(restored,{stage:'',provider:'',category:'',query:'架构',tags:['设计']});
 assert.deepEqual(filterSkills(ecc,restored).map(s=>s.id),['ecc/native/a']);
 assert.equal(filterSkills(ecc,clearState()).length,2);
});
test('route IDs use one encoded segment and malformed routes rejected',()=>{
 const id='ecc/native/a 中文'; assert.deepEqual(parseRoute(routeFor('skills',id)),{type:'skills',id});
 assert.deepEqual(parseRoute('#/references/opaque%2Fid'),{type:'references',id:'opaque/id'});
 assert.deepEqual(parseRoute('#/skills/%zz'),{type:'invalid'});
 assert.deepEqual(parseRoute('#/skills/ecc/native/a'),{type:'invalid'});
 assert.deepEqual(parseRoute(''),{type:'list'});
});

test('full-text terms cross fields; tags/category participate; unrelated terms and missing searchText remain safe',()=>{
 const rows=[
  {id:'one',callName:'ecc:one',nameZh:'任务安排',description:'Original summary',searchText:'独有正文 orchestration',tags:['多Agent'],category:'项目规划'},
  {id:'two',callName:'ecc:two',nameZh:'其他技能',description:'Another summary',tags:['测试'],category:'开发'}
 ];
 assert.deepEqual(filterSkills(rows,{query:'ORCHESTRATION'}).map(s=>s.id),['one']);
 assert.deepEqual(filterSkills(rows,{query:'多Ａｇｅｎｔ   独有正文\noriginal'}).map(s=>s.id),['one']);
 assert.deepEqual(filterSkills(rows,{query:'项目规划'}).map(s=>s.id),['one']);
 assert.deepEqual(filterSkills(rows,{query:'orchestration absent'}),[]);
 assert.deepEqual(filterSkills(rows,{query:'original',tags:['测试']}),[]);
 assert.deepEqual(filterSkills(rows,{query:'another'}).map(s=>s.id),['two']);
 assert.deepEqual(filterSkills(rows,{query:' \t\n'}),rows);
 assert.deepEqual(rows[0].tags,['多Agent']);
});

test('explicit orchestration word forms match each other without inventing synonyms or word stems',()=>{
 const forms=['orchestration','orchestrate','orchestrates','orchestrated','orchestrating','orchestrator','orchestrators'];
 const rows=forms.map((word,i)=>({id:String(i),searchText:`A ${word} workflow.`}));
 for(const query of forms)assert.equal(filterSkills(rows,{query}).length,forms.length);
 assert.equal(filterSkills([{searchText:'orchestratingly orchestra'}],{query:'orchestration'}).length,0);
 assert.equal(filterSkills([{searchText:'编排任务'}],{query:'orchestration'}).length,0);
 assert.equal(filterSkills(rows,{query:'orch'}).length,forms.length);
});

test('relevance orders name, tag/category, descriptions/scenarios, then body with stable ties',()=>{
 const rows=[
  {id:'body',searchText:'Orchestration'},
  {id:'summary',summaryZh:'Orchestration'},
  {id:'tag',tags:['Orchestration']},
  {id:'call',callName:'ecc:team-agent-orchestration'},
  {id:'name',nameZh:'Orchestration'},
  {id:'scenario',scenariosZh:['Orchestration']}
 ];
 assert.deepEqual(filterSkills(rows,{query:'orchestration'}).map(s=>s.id),['call','name','tag','summary','scenario','body']);
 assert.deepEqual(filterSkills(rows,clearState()),rows);
 // A refreshed snapshot must build its own index even when stable IDs are unchanged.
 const old={id:'refresh',searchText:'oldtoken'};
 assert.equal(filterSkills([old],{query:'oldtoken'}).length,1);
 assert.equal(filterSkills([{...old,searchText:'newtoken'}],{query:'oldtoken'}).length,0);
 assert.equal(filterSkills([{...old,searchText:'newtoken'}],{query:'newtoken'}).length,1);
});

const workflowRows=[
 {id:'publish',provider:'ecc',category:'交付',tags:['发布部署','GitHub'],nameZh:'发布'},
 {id:'version',provider:'ecc',category:'交付',tags:['版本管理','GitHub'],nameZh:'版本'},
 {id:'both',provider:'ecc',category:'交付',tags:['发布部署','版本管理'],nameZh:'双标签'},
 {id:'other',provider:'ecc',category:'开发',tags:['GitHub','开发实现'],nameZh:'开发'}
];
test('workflow stage uses OR internally and AND with all other filters, with no duplicates',()=>{
 const stage='development-release';
 assert.deepEqual(filterSkills(workflowRows,{stage}).map(s=>s.id),['publish','version','both']);
 assert.deepEqual(filterSkills(workflowRows,{stage,tags:['GitHub'],provider:'ecc',category:'交付',query:'版本'}).map(s=>s.id),['version']);
 assert.deepEqual(filterSkills(workflowRows,{stage,tags:['开发实现']}),[]);
 assert.deepEqual(filterSkills(workflowRows,{stage,provider:'other'}),[]);
 assert.deepEqual(filterSkills(workflowRows,{stage,category:'开发'}),[]);
});
test('workflow selection replaces across tracks, toggles off and preserves independent filters',()=>{
 const state={...clearState(),stage:'management-needs',tags:['GitHub'],query:'发布',category:'交付',provider:'ecc'};
 const next=toggleStage(state,'development-release');
 assert.deepEqual(next,{...state,stage:'development-release'});
 assert.deepEqual(next.tags,['GitHub']);
 assert.equal(toggleStage(next,'development-release').stage,'');
 assert.equal(selectProvider(next,'').stage,'development-release');
 assert.equal(clearState().stage,'');
});
test('workflow persistence accepts known IDs, rejects invalid types and migrates old preferences',()=>{
 const next=normalizeState({...clearState(),stage:'development-release'},workflowRows);
 assert.equal(next.stage,'development-release');
 for(const stage of ['missing',{},null,1])assert.equal(normalizeState({stage},workflowRows).stage,'');
 assert.equal(normalizeState({tags:['GitHub']},workflowRows).stage,'');
 assert.equal(workflowStage('development-release').label,'发布部署');
 assert.equal(WORKFLOWS.length,2);
 assert.equal(new Set(WORKFLOWS.flatMap(w=>w.stages.map(s=>s.id))).size,14);
});
