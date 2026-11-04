import test from 'node:test';
import assert from 'node:assert/strict';
import {EMBEDDED_GUIDE} from '../../web/embedded-guide.mjs';
import {routeFor,parseRoute,WORKFLOWS,normalizeState,clearState} from '../../web/state.mjs';

test('embedded guide preserves the approved order and exact ECC native IDs independently of filters',()=>{
 const expected=[
  ['需求与验收','intent-driven-development'],['变更分析','change-impact'],
  ['项目上下文','context-and-decisions'],['架构决策','architecture-decision-records'],
  ['C++ 实现与审查','cpp-coding-standards'],['C++ 单元测试','cpp-testing'],
  ['测试管理','test-collaboration'],['模块回归','module-regression'],
  ['性能优化','benchmark-optimization-loop'],['提交说明','conventional-commit-review']
 ];
 assert.deepEqual(EMBEDDED_GUIDE.map(({label,slug})=>[label,slug]),expected);
 assert.equal(new Set(EMBEDDED_GUIDE.map(e=>e.id)).size,10);
 for(const entry of EMBEDDED_GUIDE){
  assert.equal(entry.id,`ecc/native/${entry.slug}`);
  assert.ok(entry.description.length>10);
  assert.deepEqual(parseRoute(routeFor('skills',entry.id)),{type:'skills',id:entry.id});
 }
 assert.equal(WORKFLOWS.length,2);
 assert.equal(WORKFLOWS.flatMap(w=>w.stages).length,14);
});

test('restoring ECC clears retired Matt preferences without hiding valid ECC skills',()=>{
 const skills=[{provider:'ecc',category:'开发',tags:['测试']}];
 assert.deepEqual(normalizeState({provider:'mattpocock',query:'旧 Matt 搜索',category:'工程开发',tags:['测试'],stage:'development-test'},skills),clearState());
 assert.equal(normalizeState({provider:'ecc',query:'架构',tags:['测试']},skills).query,'架构');
});
