import assert from 'node:assert/strict';
import path from 'node:path';
// Confirmed guide reading contract; independent of the runtime skill catalog.
const WORKFLOWS = [
 {
  "id": "feature",
  "label": "新需求开发",
  "goal": "把新想法变成范围清楚、可以验证和交付的功能。",
  "input": "任务目标、使用场景、已有约束与用户决定。",
  "output": "确认后的方案、授权内变更及分层验证记录。",
  "stages": [
   {
    "id": "feature-clarify",
    "label": "需求澄清",
    "goal": "说清要解决什么问题，以及什么结果算满足需求。",
    "input": "目标、使用场景、预期行为和限制。",
    "output": "需求范围、验收条件及待确认问题。"
   },
   {
    "id": "feature-impact",
    "label": "现状与影响分析",
    "goal": "查清已有能力，以及改动会影响哪里。",
    "input": "目标仓库、现有接口、数据及需求范围。",
    "output": "当前行为依据、依赖、影响范围和未知项。"
   },
   {
    "id": "feature-design",
    "label": "方案论证",
    "goal": "比较可行办法，说明各自代价和风险。",
    "input": "需求、现状证据、技术约束和备选办法。",
    "output": "方案比较、风险和需要用户决定的事项。"
   },
   {
    "id": "feature-plan",
    "label": "计划与确认",
    "goal": "把选定方案拆成可执行步骤，并核对授权。",
    "input": "已确认方案、范围、依赖及验证要求。",
    "output": "实施步骤、退出条件和用户确认状态。"
   },
   {
    "id": "feature-implement",
    "label": "开发实现",
    "goal": "在授权范围内实现功能，并保留必要测试。",
    "input": "已确认计划、源码和实施授权。",
    "output": "实际变更、必要测试及偏离计划的说明。"
   },
   {
    "id": "feature-verify",
    "label": "独立审查与测试验证",
    "goal": "分别检查实现、测试及尚未验证的风险。",
    "input": "最终变更、需求、测试环境与证据。",
    "output": "独立审查结论、测试记录及未完成验证。"
   },
   {
    "id": "feature-deliver",
    "label": "验收与交付",
    "goal": "核对验收条件，说明交付内容和使用限制。",
    "input": "验收条件、验证记录与交付范围。",
    "output": "验收证据、交付说明及遗留事项。"
   }
  ]
 },
 {
  "id": "maintenance",
  "label": "故障维护",
  "goal": "用证据定位故障，在确认范围内修复并保护相关行为。",
  "input": "环境、复现操作、预期与实际结果及已有日志。",
  "output": "故障证据、授权内修复、回归结果和关闭条件。",
  "stages": [
   {
    "id": "maintenance-collect",
    "label": "现象收集",
    "goal": "准确记录发生了什么，避免把猜测当原因。",
    "input": "环境、版本、操作、预期与实际结果。",
    "output": "问题记录、现有证据及待补信息。"
   },
   {
    "id": "maintenance-diagnose",
    "label": "复现与定位",
    "goal": "用复现、日志和最小实验检验原因。",
    "input": "问题记录、源码、日志及获准使用的环境。",
    "output": "复现证据、已确认原因或仍待验证的假设。"
   },
   {
    "id": "maintenance-solution",
    "label": "修复方案",
    "goal": "说明如何修复，以及会影响哪些既有行为。",
    "input": "故障证据、影响范围、限制和修复选项。",
    "output": "修复选项、兼容风险及待用户决定事项。"
   },
   {
    "id": "maintenance-plan",
    "label": "计划与确认",
    "goal": "明确修复步骤、验证安排和实施授权。",
    "input": "选定修复方案、回归范围及用户决定。",
    "output": "修复计划、回退条件和确认状态。"
   },
   {
    "id": "maintenance-implement",
    "label": "修复实现",
    "goal": "只修复获准内容，并保留故障回归保护。",
    "input": "已确认计划、实施授权及故障用例。",
    "output": "实际修复、必要测试和范围变化说明。"
   },
   {
    "id": "maintenance-verify",
    "label": "原故障验证、回归与独立审查",
    "goal": "重验原失败场景，检查相关功能是否退化。",
    "input": "修复差异、原失败步骤及回归要求。",
    "output": "原故障和回归记录、独立审查及验证限制。"
   },
   {
    "id": "maintenance-close",
    "label": "修复验收与关闭",
    "goal": "核对修复是否满足关闭条件并登记遗留项。",
    "input": "关闭条件、修复和验证证据。",
    "output": "验收结论、关闭建议及尚未完成事项。"
   }
  ]
 }
];
const SUPPORT_GROUPS = [
 {
  "id": "project-context",
  "label": "项目理解",
  "goal": "了解项目结构、业务术语和已有决定。",
  "input": "项目入口、已有文档和需要理解的问题。",
  "output": "有依据的项目说明、术语及未知项。"
 },
 {
  "id": "environment-tools",
  "label": "环境与工具",
  "goal": "了解工具用途、环境依赖及操作边界。",
  "input": "当前环境、工具配置和具体使用问题。",
  "output": "环境说明、可行操作及需要授权的事项。"
 },
 {
  "id": "docs-collaboration",
  "label": "文档与协作",
  "goal": "整理信息和交接材料，明确事实与责任。",
  "input": "已有文档、任务范围和协作目标。",
  "output": "清楚的说明、交接材料及待确认事项。"
 }
];

export async function checkMattpocockGuide(page,check,reportDir,base){
 const route='#/guides/mattpocock-skills';
 const external=[];
 const observe=request=>{if(new URL(request.url()).origin!==new URL(base).origin)external.push(request.url());};
 page.on('request',observe);
 const frame=()=>page.frameLocator('.development-guide-frame[data-guide-id="mattpocock-skills"]');
 const ready=()=>frame().locator('#work-type-filter [data-workflow="all"]').waitFor({state:'visible'});
 const visible=()=>frame().locator('article.skill-card:not([hidden])');
 const workType=id=>frame().locator(`#work-type-filter [data-workflow="${id}"]`);
 const visibleIds=()=>visible().evaluateAll(nodes=>nodes.map(n=>n.id).sort());
 const options=()=>frame().locator('#stage-filter option').evaluateAll(nodes=>nodes.map(n=>({id:n.value,label:n.textContent})));
 const assertContext=async expected=>{
  const context=frame().locator('#guide-stage-context');
  assert.equal(await context.count(),1);
  assert.equal(await context.getAttribute('aria-label'),'当前阅读阶段说明');
  assert.equal(await context.getAttribute('aria-live'),'polite');
  assert.equal(await context.locator('h3').innerText(),expected.label);
  assert.deepEqual(await context.locator('dt').allTextContents(),['目标','需要准备','应得到什么']);
  const values=await context.locator('dd').allTextContents();
  assert.equal(values.length,3);assert.equal(values.every(value=>value.trim().length>0),true);
  if(expected.goal!==undefined)assert.deepEqual(values,[expected.goal,expected.input,expected.output]);
 };
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base);await page.locator('#search').waitFor();
 await page.locator('.results-heading').getByRole('button',{name:'清除全部筛选',exact:true}).click();
 await page.locator('#provider').selectOption('ecc');await page.locator('#search').fill('架构');
 await page.locator('.card').getByRole('button',{name:'安全',exact:true}).click();
 const expectedIds=await page.locator('.card').evaluateAll(nodes=>nodes.map(n=>n.dataset.skillId));
 const preferences=await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters);
 await check('双指南分别激活，Matt 入口支持键盘且保留阅读器框架',async()=>{
  const link=page.getByRole('link',{name:'Mattpocock Skills 指南',exact:true});
  await link.focus();await page.keyboard.press('Enter');await ready();
  assert.equal(new URL(page.url()).hash,route);
  assert.equal(await link.getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#navigation .guide-nav.active').count(),1);
  assert.equal(await page.getByRole('link',{name:'多智能体开发全流程',exact:true}).getAttribute('aria-current'),null);
  assert.equal(await frame().locator('article.skill-card').count(),27);
  assert.equal(await frame().locator('script:not([src]),style').count(),0);
  await page.screenshot({path:path.join(reportDir,'mattpocock-guide-desktop.png'),fullPage:true});
  await page.getByRole('link',{name:'多智能体开发全流程',exact:true}).click();
  await page.frameLocator('.development-guide-frame[data-guide-id="multi-agent-development"]').locator('#result-count').filter({hasText:'显示'}).waitFor();
  assert.equal(await page.getByRole('link',{name:'多智能体开发全流程',exact:true}).getAttribute('aria-current'),'page');
  assert.equal(await page.getByRole('link',{name:'Mattpocock Skills 指南',exact:true}).getAttribute('aria-current'),null);
  await page.getByRole('link',{name:'Mattpocock Skills 指南',exact:true}).click();await ready();
 });
 await check('Matt 工作类型、阶段ID和名称符合已确认阅读分类',async()=>{
  assert.deepEqual(await frame().locator('#work-type-filter [data-workflow]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.workflow,label:n.textContent}))),[{id:'all',label:'全部'},...WORKFLOWS.map(({id,label})=>({id,label})),{id:'support',label:'通用支持'}]);
  const groups=[...WORKFLOWS,{id:'support',label:'通用支持',stages:SUPPORT_GROUPS}];
  const expectedStages=stages=>[{id:'all',label:'全部阶段'},...stages.map(({id,label})=>({id,label}))];
  assert.equal(await workType('all').getAttribute('aria-pressed'),'true');
  await assertContext({label:'全部阅读资料'});
  assert.deepEqual(await options(),expectedStages(groups.flatMap(g=>g.stages)));
  assert.deepEqual(await frame().locator('#stage-filter optgroup').evaluateAll(nodes=>nodes.map(n=>n.label)),groups.map(g=>g.label));
  for(const group of groups){
   await workType(group.id).click();
   assert.equal(await workType(group.id).getAttribute('aria-pressed'),'true');
   assert.equal(await frame().locator('#work-type-filter [aria-pressed="true"]').count(),1);
   assert.deepEqual(await options(),expectedStages(group.stages));
   await assertContext(group);
   for(const stage of group.stages){
    await frame().locator('#stage-filter').selectOption(stage.id);
    await assertContext(stage);
   }
   await frame().locator('#stage-filter').selectOption('all');await assertContext(group);
  }
  await workType('all').click();await assertContext({label:'全部阅读资料'});
 });
 await check('Matt 两流程和支持分组按阶段并集展示，多阶段卡片不重复',async()=>{
  const originalIds=await visibleIds();assert.equal(originalIds.length,27);
  assert.equal(new Set(originalIds).size,27);
  for(const group of [...WORKFLOWS,{id:'support',stages:SUPPORT_GROUPS}]){
   await workType(group.id).click();const union=await visibleIds();
   assert.ok(union.length>0);assert.equal(union.length,new Set(union).size);
   const acrossStages=[];
   for(const stage of group.stages){
    await frame().locator('#stage-filter').selectOption(stage.id);
    const actual=await visibleIds();acrossStages.push(...actual);
    assert.equal(await visible().evaluateAll((nodes,id)=>nodes.every(n=>n.dataset.workflowStages.split(/\s+/u).includes(id)),stage.id),true);
   }
   assert.deepEqual([...new Set(acrossStages)].sort(),union);
   if(group.id!=='support')assert.ok(acrossStages.length>union.length,'跨阶段重复归属应在流程并集中只计一次');
   await frame().locator('#stage-filter').selectOption('all');assert.deepEqual(await visibleIds(),union);
   assert.equal(await frame().locator('#result-count').innerText(),`显示 ${union.length} / 27 项技能`);
   assert.equal(await frame().locator('article.skill-card').count(),27);
  }
  await workType('all').click();assert.deepEqual(await visibleIds(),originalIds);
 });
 await check('Matt TDD跨流程计划和实现，故障诊断覆盖维护五阶段',async()=>{
  const cases=[['feature',['feature-plan','feature-implement'],'skill-tdd'],['maintenance',['maintenance-plan','maintenance-implement'],'skill-tdd'],['maintenance',['maintenance-collect','maintenance-diagnose','maintenance-solution','maintenance-implement','maintenance-verify'],'skill-diagnosing-bugs']];
  for(const [workflow,stages,id] of cases){
   await workType(workflow).click();
   for(const stage of stages){
    await frame().locator('#stage-filter').selectOption(stage);
    assert.equal(await frame().locator(`#${id}`).isVisible(),true);
    assert.equal((await visibleIds()).filter(value=>value===id).length,1);
   }
  }
  await workType('feature').click();await frame().locator('#stage-filter').selectOption('feature-verify');
  assert.equal(await frame().locator('#skill-tdd').isVisible(),false);
  assert.equal(await frame().locator('#skill-code-review').isVisible(),true);
  await frame().locator('#reset-filters').click();
 });
 await check('Matt 搜索与工作类型及阶段取交集，切类型保留查询，空态可键盘恢复',async()=>{
  await frame().locator('#skill-search').fill('TDD');const allSearch=await visibleIds();
  assert.ok(allSearch.includes('skill-tdd'));
  const stageMembers=await frame().locator('article.skill-card').evaluateAll(nodes=>nodes.filter(n=>n.dataset.workflowStages.split(/\s+/u).includes('feature-implement')).map(n=>n.id));
  await workType('feature').click();await frame().locator('#stage-filter').selectOption('feature-implement');
  assert.equal(await frame().locator('#skill-search').inputValue(),'TDD');
  assert.deepEqual(await visibleIds(),allSearch.filter(id=>stageMembers.includes(id)));
  await workType('maintenance').click();assert.equal(await frame().locator('#stage-filter').inputValue(),'all');
  assert.equal(await frame().locator('#skill-search').inputValue(),'TDD');
  assert.ok((await visibleIds()).includes('skill-tdd'));
  await frame().locator('#stage-filter').selectOption('maintenance-plan');
  await frame().locator('#skill-search').fill('tdd no-such-skill-8e5f');
  assert.equal(await visible().count(),0);assert.equal(await frame().locator('#empty-state').isVisible(),true);
  assert.equal(await frame().locator('#result-count').innerText(),'显示 0 / 27 项技能');
  await frame().locator('#reset-filters').focus();await page.keyboard.press('Enter');
  assert.equal(await visible().count(),27);assert.equal(await frame().locator('#skill-search').inputValue(),'');
  assert.equal(await frame().locator('#stage-filter').inputValue(),'all');
  assert.equal(await workType('all').getAttribute('aria-pressed'),'true');
  assert.equal(await frame().locator('#empty-state').isVisible(),false);
  await assertContext({label:'全部阅读资料'});
  assert.equal(await frame().locator('#skill-search').evaluate(n=>n===document.activeElement),true);
 });
 await check('Matt 章节导航隔离路由，复制成功和失败均反馈',async()=>{
  await frame().locator('nav a[href="#skills"]').click();assert.equal(new URL(page.url()).hash,route);
  const copy=frame().locator('#skill-tdd button[data-copy-target="call-tdd"]');
  const target=(await copy.getAttribute('data-copy-target')).replace(/^#/, '');
  const expected=await frame().locator(`[id="${target}"]`).textContent();
  assert.equal(await copy.count(),1);assert.match(expected,/\/tdd/u);
  await workType('feature').click();await frame().locator('#stage-filter').selectOption('feature-implement');
  await copy.click();await frame().locator('#copy-status').filter({hasText:'已复制'}).waitFor();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),expected);
  const native=page.frames().find(f=>f.url().includes('/guides/mattpocock-skills/index.html'));
  await native.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}},configurable:true});document.execCommand=()=>false;});
  await copy.click();await frame().locator('#copy-status').filter({hasText:'复制失败'}).waitFor();
 });
 await check('Matt 直达刷新、独立页与返回列表保留筛选',async()=>{
  await page.goto(base+'/'+route);await ready();await page.reload();await ready();
  const opened=page.context().waitForEvent('page');await page.getByRole('link',{name:'单独打开指南',exact:true}).click();
  const tab=await opened;
  try{await tab.locator('#skill-search').waitFor();assert.equal(new URL(tab.url()).pathname,'/guides/mattpocock-skills/index.html');assert.equal(await tab.locator('article.skill-card').count(),27);await tab.reload();await tab.locator('#skill-search').waitFor();}finally{await tab.close();}
  await page.getByRole('link',{name:'返回技能列表',exact:true}).click();await page.locator('#search').waitFor();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters),preferences);
  assert.equal(await page.locator('#search').inputValue(),'架构');
  assert.equal(await page.locator('#provider').inputValue(),'ecc');
  assert.match(await page.locator('.active-filters').innerText(),/标签：安全/);
  assert.deepEqual(await page.locator('.card').evaluateAll(nodes=>nodes.map(n=>n.dataset.skillId)),expectedIds);
 });
 await check('Matt 390px 导航、键盘筛选与页面宽度',async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'技能导航',exact:true}).click();
  await page.getByRole('link',{name:'Mattpocock Skills 指南',exact:true}).click();await ready();
  assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await frame().locator('html').evaluate(n=>n.scrollWidth<=innerWidth),true);
  await workType('feature').focus();await page.keyboard.press('Enter');
  await frame().locator('#stage-filter').selectOption('feature-implement');
  await frame().locator('#skill-search').focus();await page.keyboard.type('tdd');
  assert.equal(await frame().locator('#skill-search').evaluate(n=>n===document.activeElement),true);
  assert.equal(await frame().locator('#skill-tdd').isVisible(),true);
  assert.ok(await visible().count()>0);
  await page.screenshot({path:path.join(reportDir,'mattpocock-guide-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'/#/guides/unknown');await page.getByRole('alert').waitFor();assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('button',{name:'返回技能列表',exact:true}).click();await page.locator('#search').waitFor();
  assert.deepEqual(external,[]);
 });
 page.off('request',observe);
}
