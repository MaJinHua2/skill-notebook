import test from 'node:test';
import assert from 'node:assert/strict';
import {filterSkills, inventory, normalizeState, selectProvider, toggleTag, clearState, parseRoute, routeFor} from '../../web/state.mjs';
const skills = [
{id:'ecc/native/a',provider:'ecc',category:'开发',callName:'ecc:a',nameZh:'架构',summaryZh:'设计接口',scenariosZh:['建立服务'],description:'Architecture',tags:['设计','接口']},
{id:'ecc/migrated/b',provider:'ecc',category:'测试',callName:'ecc:b',nameZh:'回归',tags:['测试']},
{id:'cyto/native/a',provider:'cyto',category:'开发',callName:'cyto:a',nameZh:'上下文',tags:['设计']}
];
test('AND filters combine provider/category/search/all selected tags',()=>{
 assert.equal(filterSkills(skills,{provider:'ecc',category:'开发',query:'architecture',tags:['设计','接口']}).length,1);
 assert.equal(filterSkills(skills,{provider:'',category:'',query:'',tags:['设计','接口']}).length,1);
 assert.equal(filterSkills(skills,{provider:'cyto',category:'开发',query:'',tags:['接口']}).length,0);
 assert.equal(filterSkills(skills,{query:'建立服务'}).length,1);
});
test('inventory stays independent and categories scoped by provider',()=>{
 assert.deepEqual(inventory(skills).map(x=>[x.provider,x.count,x.categories]),[['ecc',2,[{name:'测试',count:1},{name:'开发',count:1}]],['cyto',1,[{name:'开发',count:1}]]]);
});
test('provider selection clears category and preserves query and tags',()=>{
 assert.deepEqual(selectProvider({provider:'ecc',category:'开发',query:'接口',tags:['设计']},'cyto'),{provider:'cyto',category:'',query:'接口',tags:['设计']});
 assert.deepEqual(selectProvider({category:'开发',query:'a',tags:['设计']},''),{provider:'',category:'',query:'a',tags:['设计']});
});
test('normalize handles invalid and malicious persisted shape; no private fields',()=>{
 assert.deepEqual(normalizeState({provider:'absent',category:'开发',query:'x',tags:['设计','不存在','设计'],body:'secret'},skills),{provider:'',category:'',query:'x',tags:['设计']});
 assert.deepEqual(normalizeState({provider:'ecc',category:'不存在',query:5,tags:'设计'},skills),{provider:'ecc',category:'',query:'',tags:[]});
 assert.deepEqual(normalizeState(null,skills),clearState());
});
test('tags toggle and all clear',()=>{
 assert.deepEqual(toggleTag({tags:['设计']},'接口').tags,['设计','接口']);
 assert.deepEqual(toggleTag({tags:['设计','接口']},'设计').tags,['接口']);
 assert.deepEqual(clearState(),{provider:'',category:'',query:'',tags:[]});
});
test('ECC-only inventory drops removed provider/category while keeping valid search and tags',()=>{
 const ecc=skills.filter(s=>s.provider==='ecc');
 assert.deepEqual(inventory(ecc).map(s=>[s.provider,s.count]),[['ecc',2]]);
 const restored=normalizeState({provider:'cyto',category:'开发',query:'架构',tags:['设计','removed']},ecc);
 assert.deepEqual(restored,{provider:'',category:'',query:'架构',tags:['设计']});
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
