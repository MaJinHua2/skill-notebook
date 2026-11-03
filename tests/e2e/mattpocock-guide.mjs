import assert from 'node:assert/strict';
import path from 'node:path';

export async function checkMattpocockGuide(page,check,reportDir,base){
 const route='#/guides/mattpocock-skills';
 const external=[];
 const observe=request=>{if(new URL(request.url()).origin!==new URL(base).origin)external.push(request.url());};
 page.on('request',observe);
 const frame=()=>page.frameLocator('.development-guide-frame[data-guide-id="mattpocock-skills"]');
 const ready=()=>frame().locator('#skill-search').waitFor({state:'visible'});
 const visible=()=>frame().locator('article.skill-card:not([hidden])');
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base);await page.locator('.card').first().waitFor();
 await page.locator('#provider').selectOption('ecc');await page.locator('#search').fill('架构');
 const preferences=await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters);
 await check('双指南分别激活，Matt 入口支持键盘且保留 ECC 框架',async()=>{
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
 await check('Matt 索引搜索与阶段取交集，空态可键盘恢复',async()=>{
  await frame().locator('#skill-search').fill('TDD');
  assert.ok(await visible().count()>0);
  const expectedReview=await visible().evaluateAll(nodes=>nodes.filter(n=>n.dataset.stage==='review').length);
  await frame().locator('#stage-filter').selectOption('review');
  assert.equal(await visible().count(),expectedReview);
  assert.equal(await visible().evaluateAll(nodes=>nodes.every(n=>n.dataset.stage==='review')),true);
  await frame().locator('#skill-search').fill('no-such-skill-8e5f');
  assert.equal(await visible().count(),0);assert.equal(await frame().locator('#empty-state').isVisible(),true);
  await frame().locator('#reset-filters').focus();await page.keyboard.press('Enter');
  assert.equal(await visible().count(),27);assert.equal(await frame().locator('#skill-search').inputValue(),'');
  assert.equal(await frame().locator('#stage-filter').inputValue(),'all');
 });
 await check('Matt 章节导航隔离路由，复制成功和失败均反馈',async()=>{
  await frame().locator('a[href="#skills"]').first().click();assert.equal(new URL(page.url()).hash,route);
  const copy=frame().locator('button[data-copy-target]').first();
  const target=(await copy.getAttribute('data-copy-target')).replace(/^#/, '');
  const expected=await frame().locator(`[id="${target}"]`).textContent();
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
  await page.getByRole('link',{name:'返回技能列表',exact:true}).click();await page.locator('.card').waitFor();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters),preferences);
  assert.equal(await page.locator('#search').inputValue(),'架构');
 });
 await check('Matt 390px 导航、键盘筛选与页面宽度',async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'技能导航',exact:true}).click();
  await page.getByRole('link',{name:'Mattpocock Skills 指南',exact:true}).click();await ready();
  assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await frame().locator('html').evaluate(n=>n.scrollWidth<=innerWidth),true);
  await frame().locator('#skill-search').focus();await page.keyboard.type('tdd');assert.ok(await visible().count()>0);
  await page.screenshot({path:path.join(reportDir,'mattpocock-guide-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'/#/guides/unknown');await page.getByRole('alert').waitFor();assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('button',{name:'返回技能列表',exact:true}).click();await page.locator('.card').waitFor();
  assert.deepEqual(external,[]);
 });
 page.off('request',observe);
}
