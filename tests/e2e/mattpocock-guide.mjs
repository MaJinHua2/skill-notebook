import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';
// S4 冻结阅读顺序来自规格，独立于被测页面及正文。
const STAGES = [
 ['intake','需求／反馈受理','setup-matt-pocock-skills ask-matt triage'],
 ['clarify','需求讨论与问题澄清','grill-with-docs grill-me grilling domain-modeling to-questionnaire teach wait-what'],
 ['investigate','调查与方案验证','wayfinder research prototype diagnosing-bugs improve-codebase-architecture codebase-design'],
 ['specify','规格与实施计划','to-spec writing-for-agents handoff'],
 ['split','任务拆分','to-tickets'],
 ['implement','实现与测试','implement implement-spec tdd wizard'],
 ['review','独立复核','code-review pr'],
 ['accept','验收','retro'],
];
const skillIds = names => names.split(' ').map(name=>`skill-${name}`).sort();
const MEMBERSHIP = Object.fromEntries(STAGES.flatMap(([stage,,names])=>skillIds(names).map(id=>[id,[stage]])));
MEMBERSHIP['skill-domain-modeling'] = ['clarify','investigate'];
MEMBERSHIP['skill-handoff'] = ['investigate','specify','implement'];
MEMBERSHIP['skill-writing-for-agents'] = ['specify','implement'];
// 外链沿用S3b基线；S4允许改写示例参数，调用命令仍须与真实技能名一致。
const EXTERNAL_DIGEST = '365b23967614f3b7a725a5725695df8a3ff8b54a2402a2e323c2cea775b6b02d';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export async function checkMattpocockGuide(page,check,reportDir,base){
 const route='#/guides/mattpocock-skills';
 const external=[];
 const observe=request=>{if(new URL(request.url()).origin!==new URL(base).origin)external.push(request.url());};
 page.on('request',observe);
 const frame=()=>page.frameLocator('.development-guide-frame[data-guide-id="mattpocock-skills"]');
 const ready=()=>frame().locator('#stage-filter').waitFor({state:'visible'});
 const visible=()=>frame().locator('article.skill-card:not([hidden])');
 const visibleIds=()=>visible().evaluateAll(nodes=>nodes.map(n=>n.id).sort());
 const description=async name=>(await frame().locator(`#skill-${name} > p.skill-description`).allTextContents()).join('\n');
 const options=()=>frame().locator('#stage-filter option').evaluateAll(nodes=>nodes.map(n=>({id:n.value,label:n.textContent})));
 const assertStages=async()=>{
  for(const [id] of STAGES){
   const stage=frame().locator(`#stage-${id}`);
   const matches=await stage.locator(':scope > article.skill-card:not([hidden])').count();
   assert.equal(await stage.isVisible(),matches>0,`${id}: empty stages must hide`);
  }
 };
 const assertSingleColumn=async()=>{
  const layout=await frame().locator('#workflow').evaluate(workflow=>{
   const stages=[...workflow.querySelectorAll('section.workflow-stage')];
   const rect=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
   return stages.map(stage=>({id:stage.id,box:rect(stage),cards:[...stage.querySelectorAll(':scope > article.skill-card')].map(card=>({
    id:card.id,box:rect(card),minHeight:getComputedStyle(card).minHeight,shadow:getComputedStyle(card).boxShadow,
    paragraphs:[...card.querySelectorAll(':scope > p.skill-description')].map(p=>{
     const style=getComputedStyle(p);return {text:p.textContent.trim(),fontSize:parseFloat(style.fontSize),
      unclipped:p.clientHeight>=p.scrollHeight-1&&p.clientWidth>=p.scrollWidth-1,
      clamp:style.webkitLineClamp,display:style.display,visibility:style.visibility};
    }),
   }))}));
  });
  let previousStage;
  const paragraphs=[];
  for(const stage of layout){
   if(previousStage){assert.ok(stage.box.top>=previousStage.bottom-1);assert.ok(Math.abs(stage.box.left-previousStage.left)<2);assert.ok(Math.abs(stage.box.right-previousStage.right)<2);}
   previousStage=stage.box;
   let previousCard;
   for(const card of stage.cards){
    if(previousCard){assert.ok(card.box.top>=previousCard.bottom-1,`${card.id}: vertical flow`);assert.ok(Math.abs(card.box.left-previousCard.left)<2);assert.ok(Math.abs(card.box.right-previousCard.right)<2);}
    previousCard=card.box;
    assert.ok(['auto','0px'].includes(card.minHeight),`${card.id}: no equal-height placeholder`);
    assert.equal(card.shadow,'none',`${card.id}: no large panel shadow`);
    assert.ok(card.paragraphs.length>=2&&card.paragraphs.length<=3);
    for(const p of card.paragraphs){
     assert.ok(p.text.length>0);assert.ok(p.fontSize>=14);assert.ok(p.unclipped,`${card.id}: full description visible`);
     assert.ok(['none','0'].includes(p.clamp));assert.notEqual(p.display,'none');assert.equal(p.visibility,'visible');
     assert.doesNotMatch(p.text,/^(?:当前状态|下一步|如何选择|阶段目标|需要准备|应得到什么)[：:]/u);
     paragraphs.push(p.text.replace(/\s+/gu,''));
    }
   }
  }
  assert.equal(new Set(paragraphs).size,paragraphs.length,'技能说明不得整段重复');
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
 await check('Matt S4 八阶段真实归组、正文默认可见且无旧提示或重复索引',async()=>{
  assert.equal(await frame().locator('#work-type-filter').count(),0);
  assert.deepEqual(await options(),[{id:'all',label:'全部阶段'},...STAGES.map(([id,label])=>({id,label}))]);
  assert.equal(await frame().locator('#workflow').count(),1);
  assert.equal(await frame().locator('#workflow > h1#workflow-title').count(),1);
  assert.equal(await frame().locator('h1').count(),1);
  assert.deepEqual(await frame().locator('#workflow section.workflow-stage').evaluateAll(nodes=>nodes.map(n=>n.id)),STAGES.map(([id])=>`stage-${id}`));
  for(const [id,label,names] of STAGES){
   const stage=frame().locator(`#stage-${id}`);
   assert.equal(await stage.isVisible(),true);
   assert.match(await stage.locator(':scope > h2').innerText(),new RegExp(label,'u'));
   assert.deepEqual(await stage.locator(':scope > article.skill-card').evaluateAll(nodes=>nodes.map(n=>n.id)),names.split(' ').map(name=>`skill-${name}`));
  }
  assert.equal(await frame().locator('#workflow article.skill-card').count(),27);
  const expectedCards=Object.keys(MEMBERSHIP).sort();
  assert.deepEqual(await frame().locator('article.skill-card').evaluateAll(nodes=>nodes.map(n=>n.id).sort()),expectedCards);
  assert.equal(await frame().locator('article.skill-card').evaluateAll(nodes=>nodes.every(n=>n.parentElement.matches('#workflow section.workflow-stage'))),true,'所有完整条目必须直接归属阶段，无阶段外第二套正文');
  const index=frame().locator('#skill-index');
  assert.ok(await index.count()<=1,'兼容容器 ID 不得重复');
  if(await index.count()){
   assert.equal(await frame().locator('#workflow #skill-index').count(),1);
   assert.deepEqual(await index.locator('section.workflow-stage').evaluateAll(nodes=>nodes.map(n=>n.id)),STAGES.map(([id])=>`stage-${id}`));
   assert.deepEqual(await index.locator('article.skill-card').evaluateAll(nodes=>nodes.map(n=>n.id).sort()),expectedCards);
  }
  assert.equal(await frame().locator('#guide-stage-context, [data-stage-target], .stage-choice, #workflow dl, #workflow table, #workflow .panel, #workflow details').count(),0);
  assert.doesNotMatch(await frame().locator('#workflow').innerText(),/下一步与回流|选择此阶段技能|当前阅读阶段说明/u);
  for(const id of ['skills','skill-toolbar','stage-filter','skill-search','result-count','empty-state','reset-filters']){
   assert.equal(await frame().locator(`[id="${id}"]`).count(),1);
   assert.equal(await frame().locator(`#workflow #${id}`).count(),1);
   assert.equal(await frame().locator(`#${id}`).evaluate(n=>Boolean(n.closest('.workflow-stage'))),false);
  }
  for(const id of ['intro','examples','sources'])assert.equal(await frame().locator(`#${id}`).count(),1);
  for(const name of Object.keys(MEMBERSHIP)){
   const card=frame().locator(`#${name}`);
   assert.equal(await card.locator(':scope > h3').count(),1);
   const heading=await card.locator('h3').innerText();assert.ok(heading.includes(name.slice(6)));assert.match(heading,/[\p{Script=Han}]/u);
   assert.equal(await card.locator('code[id^="call-"]').isVisible(),true);
   assert.equal(await card.locator('button[data-copy-target]').isVisible(),true);
   assert.equal(await card.locator('.source-link a').isVisible(),true);
   const descriptions=card.locator(':scope > p.skill-description');
   assert.ok(await descriptions.count()>=2&&await descriptions.count()<=3);
   for(const description of await descriptions.all())assert.equal(await description.isVisible(),true);
  }
  const calls=await frame().locator('code[id^="call-"]').evaluateAll(nodes=>nodes.map(n=>[n.id,n.textContent]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0));
  assert.equal(calls.length,27);
  for(const [id,text] of calls)assert.equal(text.trim().split(/\s/u)[0],`/${id.slice(5)}`,'改写示例不能改变调用命令');
  const copies=await frame().locator('[data-copy-target]').evaluateAll(nodes=>nodes.map(n=>n.dataset.copyTarget).sort());
  assert.deepEqual(copies,[...calls.map(([id])=>id),'install-codex','scenario-bug','scenario-feature','scenario-questionnaire','scenario-review'].sort());
  assert.equal(new Set(copies).size,32);
  const links=await frame().locator('a[href^="https://"], a[href^="http://"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')).sort());
  assert.equal(digest(links),EXTERNAL_DIGEST);
  await assertSingleColumn();
 });
 await check('Matt 27技能全部有阶段入口，跨阶段只保留一个完整条目',async()=>{
  const expected=STAGES.flatMap(([, ,names])=>skillIds(names)).sort();
  assert.equal(new Set(expected).size,27);
  assert.deepEqual(await visibleIds(),expected);
  assert.deepEqual(await frame().locator('article.skill-card').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.id,n.dataset.workflowStages.split(/\s+/u)]))),MEMBERSHIP);
  const reached=new Set();
  for(const [id,,names] of STAGES){
   await frame().locator('#stage-filter').selectOption(id);
   const actual=await visibleIds();
   const readingOrder=STAGES.flatMap(([, ,skills])=>skills.split(' ').map(name=>`skill-${name}`));
   assert.deepEqual(await visible().evaluateAll(nodes=>nodes.map(n=>n.id)),readingOrder.filter(name=>MEMBERSHIP[name].includes(id)),'筛选后仍遵守S4阅读顺序');
   assert.deepEqual(actual,Object.entries(MEMBERSHIP).filter(([,stages])=>stages.includes(id)).map(([name])=>name).sort());
   await assertStages();
   assert.equal(actual.length,new Set(actual).size);
   actual.forEach(skill=>reached.add(skill));
   assert.equal(await visible().evaluateAll((nodes,stage)=>nodes.every(n=>n.dataset.workflowStages.split(/\s+/u).includes(stage)),id),true);
   assert.equal(await frame().locator('article.skill-card').count(),27);
  }
  assert.deepEqual([...reached].sort(),expected);
  // Exercise cross-stage reuse rather than inferring it from a fixed DOM count.
  let reused=false;
  for(const name of ['handoff','writing-for-agents']){
   const target=frame().locator(`#skill-${name}`);
   const stages=[];
   for(const [stage] of STAGES){
    await frame().locator('#stage-filter').selectOption(stage);
    if(await target.isVisible())stages.push(stage);
   }
   if(stages.length<2)continue;
   for(const stage of stages){
    await frame().locator('#stage-filter').selectOption(stage);
    assert.equal(await target.isVisible(),true);
    assert.equal(await target.count(),1);
    assert.equal((await visibleIds()).filter(id=>id===`skill-${name}`).length,1);
   }
   reused=true;
  }
  assert.equal(reused,true,'handoff 或 writing-for-agents 应从至少两个阶段到达同一条目');
  await frame().locator('#reset-filters').click();
  assert.deepEqual(await visibleIds(),expected);
  assert.equal(await frame().locator('#result-count').innerText(),'显示 27 / 27 项技能');
 });
 await check('Matt 需求讨论展示多个入口及组合关系，规格明确测试接口和确认边界',async()=>{
  await frame().locator('#stage-filter').selectOption('clarify');
  const discussion=frame().locator('#stage-clarify');
  for(const name of ['to-spec','to-tickets','implement','implement-spec','tdd','code-review','pr','retro']){
   assert.equal(await frame().locator(`#skill-${name}`).isVisible(),false,`澄清阶段不应展示后续技能 ${name}`);
  }
  for(const name of ['grill-with-docs','grill-me','grilling','domain-modeling','to-questionnaire','teach','wait-what']){
   assert.equal(await frame().locator(`#skill-${name}`).isVisible(),true);
   assert.equal(await discussion.locator(`:scope > #skill-${name}`).count(),1);
  }
  const withDocs=await description('grill-with-docs');
  assert.match(withDocs,/grilling/u);assert.match(withDocs,/domain-modeling/u);
  assert.match(withDocs,/组合|包含|调用|复用/u);
  assert.match(withDocs,/GLOSSARY\.md/u);
  assert.match(withDocs,/(?:业务[^。！？\n]*由用户决定|不[^。！？\n]*(?:替|代)[^。！？\n]*决定)/u);
  const grillMe=await description('grill-me');
  assert.match(grillMe,/grilling/u);
  assert.match(grillMe,/(?:不含|不包含|不承担|不负责|没有)[^。！？\n]*domain-modeling/u);
  assert.match(grillMe,/不[^。！？\n]*实施授权/u);
  await frame().locator('#stage-filter').selectOption('specify');
  const toSpec=await description('to-spec');
  // Check the concepts in the skill's prose, not a legacy stage prompt or
  // a particular adjacent phrase such as “测试接口”.
  assert.match(toSpec,/(?:测试[^。！？\n]*(?:接口|接缝|接入|位置|seam)|(?:公共接口|测试接口)[^。！？\n]*测试)/iu);
  assert.match(toSpec,/(?:用户[^。！？\n]*(?:确认|核对)|(?:确认|核对)[^。！？\n]*用户)/u);
  assert.match(toSpec,/不[^。！？\n]*(?:访谈|采访|提问)/u);
  assert.match(toSpec,/不[^。！？\n]*冻结/u);
  assert.match(toSpec,/不[^。！？\n]*授权[^。！？\n]*实施/u);
  assert.match(toSpec,/不[^。！？\n]*(?:代替|替代)[^。！？\n]*调查/u);
  assert.match(toSpec,/不[^。！？\n]*(?:完整[^。！？\n]*(?:蓝图|计划))/u);
  await frame().locator('#reset-filters').click();
 });
 await check('Matt 实现时使用TDD，独立复核及PR正文不替代验收',async()=>{
  await frame().locator('#stage-filter').selectOption('implement');
  assert.equal(await frame().locator('#skill-tdd').isVisible(),true);
  const tdd=await description('tdd');
  assert.match(tdd,/测试[^。！？\n]*(?:接口|接缝|接入|seam)/iu);
  assert.match(tdd,/(?:每次|每轮|一次|逐个|逐一)[^。！？\n]*(?:行为|循环)/u);
  assert.match(tdd,/(?:失败[^。！？\n]*通过|红[^。！？\n]*绿)/u);
  await frame().locator('#stage-filter').selectOption('review');
  for(const name of ['tdd','retro'])assert.equal(await frame().locator(`#skill-${name}`).isVisible(),false);
  for(const name of ['code-review','pr'])assert.equal(await frame().locator(`#skill-${name}`).isVisible(),true);
  assert.match(await description('code-review'),/不[^。！？\n]*验收/u);
  assert.match(await description('pr'),/不[^。！？\n]*验收/u);
  await frame().locator('#reset-filters').click();
 });
 await check('Matt retro 保持验收后可选复盘，不替代验收',async()=>{
  await frame().locator('#stage-filter').selectOption('accept');
  assert.equal(await frame().locator('#skill-retro').isVisible(),true);
  const retro=await description('retro');
  assert.match(retro,/验收后/u);assert.match(retro,/可选/u);
  assert.match(retro,/复盘/u);assert.match(retro,/不[^。！？\n]*(?:替代|代替|代表)[^。！？\n]*验收/u);
  await frame().locator('#reset-filters').click();
 });
 await check('Matt 搜索和阶段取交集，空结果可键盘重置',async()=>{
  // Independent matching oracle exercises positive multiword AND, NFKC/case/whitespace,
  // and membership intersection, including cards owned by another primary stage.
  const normalize=value=>value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu,' ').trim();
  const texts=await frame().locator('article.skill-card').evaluateAll(nodes=>nodes.map(n=>({id:n.id,text:n.textContent})));
  const expected=(query,stage)=>{
   const terms=normalize(query).split(' ').filter(Boolean);
   return texts.filter(({id,text})=>(stage==='all'||MEMBERSHIP[id].includes(stage))&&terms.every(term=>normalize(text).includes(term))).map(({id})=>id).sort();
  };
  await frame().locator('#skill-search').fill('tdd');const allSearch=await visibleIds();
  assert.ok(allSearch.includes('skill-tdd'));
  await frame().locator('#skill-search').fill('  ＴＤＤ　 ');assert.deepEqual(await visibleIds(),allSearch);
  for(const [query,stage] of [['tdd 测试','all'],['测试 tdd','implement'],['domain-modeling','investigate'],['handoff','implement'],['writing-for-agents','implement']]){
   await frame().locator('#stage-filter').selectOption(stage);
   await frame().locator('#skill-search').fill(query);
   const matches=expected(query,stage);assert.ok(matches.length>0,`${query}: positive AND fixture`);
   assert.deepEqual(await visibleIds(),matches);await assertStages();
   assert.equal(await frame().locator('#result-count').innerText(),`显示 ${matches.length} / 27 项技能`);
  }
  await frame().locator('#skill-search').fill('tdd no-such-skill-8e5f');
  assert.equal(await visible().count(),0);assert.equal(await frame().locator('#empty-state').isVisible(),true);
  await assertStages();
  assert.equal(await frame().locator('section.workflow-stage:not([hidden])').count(),0);
  assert.equal(await frame().locator('#result-count').innerText(),'显示 0 / 27 项技能');
  await frame().locator('#reset-filters').focus();await page.keyboard.press('Enter');
  assert.equal(await visible().count(),27);assert.equal(await frame().locator('#skill-search').inputValue(),'');
  assert.equal(await frame().locator('#stage-filter').inputValue(),'all');
  assert.equal(await frame().locator('#empty-state').isVisible(),false);
  await assertStages();
  assert.equal(await frame().locator('#skill-search').evaluate(n=>n===document.activeElement),true);
 });
 await check('Matt 现有场景链接恢复被筛选隐藏的技能及阶段，外层路由不变',async()=>{
  for(const query of ['', 'no-such-skill-8e5f']){
   await frame().locator('#stage-filter').selectOption('clarify');
   await frame().locator('#skill-search').fill(query);
   assert.equal(await frame().locator('#skill-to-spec').isVisible(),false);
   assert.equal(await frame().locator('#stage-specify').isVisible(),false);
   await frame().locator('#examples a[href="#skill-to-spec"]').first().click();
   const target=frame().locator('#skill-to-spec');
   await target.waitFor({state:'visible'});
   assert.equal(await frame().locator('#stage-specify').isVisible(),true);
   assert.equal(await frame().locator('#stage-filter').inputValue(),'all');
   assert.equal(await frame().locator('#skill-search').inputValue(),'');
   await assertStages();
   assert.equal(new URL(page.url()).hash,route);
   assert.equal(await target.evaluate(n=>location.hash), '#skill-to-spec');
   const native=page.frames().find(f=>f.url().includes('/guides/mattpocock-skills/index.html'));
   await native.waitForFunction(()=>{
    const r=document.querySelector('#skill-to-spec').getBoundingClientRect();
    return r.bottom>0&&r.top<innerHeight;
   });
  }
  await frame().locator('#reset-filters').click();
 });
 await check('Matt 章节导航隔离路由，复制成功和失败均反馈',async()=>{
  await frame().locator('nav a[href="#skills"]').click();assert.equal(new URL(page.url()).hash,route);
  const copy=frame().locator('#skill-tdd button[data-copy-target="call-tdd"]');
  const target=(await copy.getAttribute('data-copy-target')).replace(/^#/, '');
  const expected=await frame().locator(`[id="${target}"]`).textContent();
  assert.equal(await copy.count(),1);assert.match(expected,/\/tdd/u);
  await frame().locator('#stage-filter').selectOption('implement');
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
  await frame().locator('#reset-filters').focus();await page.keyboard.press('Enter');
  await assertSingleColumn();
  await frame().locator('#stage-filter').focus();
  await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');
  assert.equal(await frame().locator('#stage-filter').inputValue(),'intake');
  await frame().locator('#stage-filter').selectOption('implement');
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
