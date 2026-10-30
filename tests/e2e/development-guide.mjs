import assert from 'node:assert/strict';
import path from 'node:path';

export async function checkDevelopmentGuide(page,check,reportDir,base){
 await page.setViewportSize({width:1440,height:1000});
 const route='#/guides/multi-agent-development';
 const guide=()=>page.frameLocator('.development-guide-frame');
 const ready=()=>guide().locator('#result-count').filter({hasText:'显示'}).waitFor();
 const visible=()=>guide().locator('.step:not([hidden])');
 await page.goto(base);await page.locator('.card').first().waitFor();
 await page.getByRole('button',{name:'ECC 模块 · 3',exact:true}).click();
 await page.getByRole('button',{name:'开发 · 2',exact:true}).click();
 await page.locator('#search').fill('架构');
 await page.locator('.card').getByRole('button',{name:'安全',exact:true}).click();
 await page.locator('.workflow-filter summary').click();
 await page.locator('[data-stage="development-review"]').click();
 const preferences=await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters);
 await check('全流程指南入口可键盘打开，保留完整内容和原稿布局',async()=>{
  const entry=page.getByRole('link',{name:'多智能体开发全流程',exact:true});
  await entry.focus();await page.keyboard.press('Enter');await ready();
  assert.equal(new URL(page.url()).hash,route);
  assert.equal(await entry.getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#navigation [aria-current="page"]').count(),1);
  assert.equal(await guide().locator('.step').count(),18);
  assert.equal(await guide().locator('.role').count(),7);
  assert.equal(await guide().locator('.doc').count(),6);
  assert.equal(await guide().locator('.inventory-item').count(),22);
  assert.match(await guide().locator('#example pre').innerText(),/\$ecc:dev-team \$ecc:intent-driven-development/);
  assert.equal(await guide().locator('script:not([src]),style').count(),0);
  assert.match(await guide().locator('.hero').evaluate(n=>getComputedStyle(n).backgroundImage),/gradient/);
  const main=await guide().locator('.step-main').first().boundingBox(),skill=await guide().locator('.step-skills').first().boundingBox();
  assert.ok(skill.x>main.x+main.width);
  await page.screenshot({path:path.join(reportDir,'development-guide-desktop.png'),fullPage:true});
 });
 await check('指南搜索与阶段筛选取交集，空结果可恢复',async()=>{
  await guide().getByRole('button',{name:'需求定义',exact:true}).click();
  assert.equal(await visible().count(),3);
  await guide().locator('#search').fill('dev-team');assert.equal(await visible().count(),3);
  await guide().locator('#search').fill('module-regression');assert.equal(await visible().count(),0);
  assert.equal(await guide().locator('#empty').isVisible(),true);
  await guide().getByRole('button',{name:'全部',exact:true}).click();assert.equal(await visible().count(),1);
  assert.match(await visible().innerText(),/下游模块回归/);
  await guide().locator('#search').fill('');assert.equal(await visible().count(),18);
 });
 await check('指南章节锚点隔离于阅读器路由，复制和无剪贴板 API 降级有效',async()=>{
  await guide().getByRole('link',{name:'技能清单',exact:true}).click();
  assert.equal(new URL(page.url()).hash,route);
  const copy=guide().locator('#skills [data-skill-copy="$ecc:dev-team"]');
  await copy.click();await guide().locator('#copy-status').filter({hasText:'已复制技能：$ecc:dev-team'}).waitFor();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'$ecc:dev-team');
  const frame=page.frames().find(f=>f.url().includes('/guides/multi-agent-development/index.html'));
  await frame.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true}));
  const fallback=guide().locator('#skills [data-skill-copy="$ecc:product-lens"]');
  await fallback.click();await guide().locator('#copy-status').filter({hasText:'已复制技能：$ecc:product-lens'}).waitFor();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'$ecc:product-lens');
  await frame.evaluate(()=>{document.execCommand=()=>false;});
  await copy.click();await guide().locator('#copy-status').filter({hasText:'复制失败'}).waitFor();
 });
 await check('指南刷新、返回及浏览器历史保留原技能筛选',async()=>{
  await page.reload();await ready();assert.equal(await visible().count(),18);
  await page.getByRole('link',{name:'返回技能列表',exact:true}).click();await page.locator('.card').waitFor();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters),preferences);
  assert.equal(await page.locator('#search').inputValue(),'架构');
  assert.equal(await page.locator('#provider').inputValue(),'ecc');
  assert.match(await page.locator('.active-filters').innerText(),/开发.*架构.*安全/);
  assert.equal(await page.locator('[data-stage="development-review"]').getAttribute('aria-pressed'),'true');
  await page.goBack();await ready();await page.goForward();await page.locator('.card').waitFor();
 });
 await check('指南支持新标签页、单独打开及直接深链',async()=>{
  const opened=page.context().waitForEvent('page');
  await page.getByRole('link',{name:'多智能体开发全流程',exact:true}).click({modifiers:['Control']});
  const tab=await opened;
  try{await tab.frameLocator('.development-guide-frame').locator('#result-count').filter({hasText:'显示'}).waitFor();assert.equal(new URL(tab.url()).hash,route);}finally{await tab.close();}
  await page.goto(base+'/'+route);await ready();
  const standaloneOpened=page.context().waitForEvent('page');
  await page.getByRole('link',{name:'单独打开指南',exact:true}).click();const standalone=await standaloneOpened;
  try{await standalone.locator('#result-count').filter({hasText:'显示'}).waitFor();assert.equal(await standalone.locator('.step').count(),18);}finally{await standalone.close();}
 });
 await check('390px 手机指南无横向溢出，导航与筛选可操作',async()=>{
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'技能导航',exact:true}).click();
  await page.getByRole('link',{name:'多智能体开发全流程',exact:true}).click();
  assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await guide().locator('html').evaluate(n=>n.scrollWidth<=innerWidth),true);
  await guide().getByRole('button',{name:'交付',exact:true}).click();assert.equal(await visible().count(),1);
  await page.screenshot({path:path.join(reportDir,'development-guide-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('link',{name:'返回技能列表',exact:true}).click();await page.locator('.card').waitFor();
 });
}
