import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { createApp } from '../../src/server/app.mjs';
import { checkEmbeddedGuide } from './embedded-guide.mjs';
import { checkDevelopmentGuide } from './development-guide.mjs';
import { checkNoteStatus } from './note-status.mjs';

// Isolated test browser/profile and synthetic documents; never attaches to user tabs.
const reportDir=path.resolve('.local/acceptance');
await mkdir(reportDir,{recursive:true});
const work=await mkdtemp(path.resolve('.local/e2e-'));
const hash=value=>createHash('sha256').update(value).digest('hex');
const sources=[], notes=[], sourceFiles=[];
const cases=[
 ['ecc','native','alpha','架构安全审查',['审查','安全'],'开发'],
 ['ecc','native','beta','界面整理',['前端'],'开发'],
 ['ecc','migrated','source-command-demo','迁移入口示例',['审查'],'协作'],
 ['cyto','native','alpha','同名项目审查',['审查','安全'],'开发']
];
const attack='<script>globalThis.readerXss=true</script><img src="https://blocked.invalid/image.png" onerror="globalThis.readerXss=true"><a href="javascript:globalThis.readerXss=true">危险链接</a><div onclick="globalThis.readerXss=true">事件属性</div>';
for(const provider of ['ecc','cyto']) {
 const root=path.join(work,provider);await mkdir(path.join(root,'.codex-plugin'),{recursive:true});
 await writeFile(path.join(root,'.codex-plugin/plugin.json'),JSON.stringify({name:provider,version:'1.0.0',skills:'./skills'}));
 const entries=[{kind:'native',directory:'skills'}];if(provider==='ecc')entries.push({kind:'migrated',directory:'.codex-plugin/migrated-command-skills'});
 sources.push({id:provider,label:provider==='ecc'?'ECC':'Cyto',root,version:'1.0.0',entries});
 for(const [p,kind,slug,nameZh,tags,category] of cases.filter(x=>x[0]===provider)) {
  const dir=path.join(root,entries.find(e=>e.kind===kind).directory,slug);await mkdir(dir,{recursive:true});
  const body='# 原始标题\n\n'+('完整段落中的长正文。\n\n'.repeat(160))+'\n## 末尾标题\n\n正文结束标记\n\n| 列一 | 列二 |\n|---|---|\n| 测试 | 表格 |\n\n```js\n'+('veryLongName'.repeat(30))+'\n```\n\n[第一篇](guide.md)\n\n[外部资料](https://example.test/document)\n\n'+attack;
  const searchableBody=body+(p==='ecc'&&slug==='alpha'?'\n\nOrchestrating hidden-search-token.':'');
  const raw=`---\nname: ${slug}\ndescription: >-\n  Original description\n  searchable\n---\n${searchableBody}`;
  const file=path.join(dir,'SKILL.md');await writeFile(file,raw);sourceFiles.push([file,raw]);
  await writeFile(path.join(dir,'guide.md'),'# 第一篇关联文档\n\nreference-only-needle\n\n[第二篇](nested.md)');
  await writeFile(path.join(dir,'nested.md'),'# 第二篇关联文档\n\n嵌套阅读内容');
  notes.push({id:`${p}/${kind}/${slug}`,callName:`${p}:${slug}`,nameZh,summaryZh:`${nameZh}的具体用途说明`,scenariosZh:['检查具体任务是否适用','对照原文理解操作边界'],tags,category,version:'1.0.0',sourceHash:hash(raw)});
 }
}
const noteFile=path.join(work,'notes.json');await writeFile(noteFile,JSON.stringify(notes));
const server=await createApp({config:{schema:1,sources},notesFiles:[noteFile],webRoot:path.resolve('dist')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
const checks=[],errors=[],externalRequests=[];
async function check(name,run){await run();checks.push({name,status:'passed'});console.log(`通过：${name}`);}
try {
 const executablePath=process.env.SKILL_READER_TEST_BROWSER||['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
 browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(!request.url().startsWith(base)&&!request.url().startsWith('data:'))externalRequests.push(request.url());});
 await checkNoteStatus(browser,check,reportDir);
 await page.goto(base);await page.locator('.card').first().waitFor();
 await check('首次全部视图与两个模块收起',async()=>{
  assert.equal(await page.locator('.card').count(),4);
  assert.match(await page.locator('#match-count').innerText(),/匹配 4 项 \/ 库存 4 项/);
  assert.equal(await page.getByRole('button',{name:'展开 ECC 分类',exact:true}).getAttribute('aria-expanded'),'false');
  assert.equal(await page.getByRole('button',{name:'展开 Cyto 分类',exact:true}).getAttribute('aria-expanded'),'false');
 });
 await check('键盘跳过导航保持列表路由',async()=>{
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.card').count(),4);
  assert.equal(await page.locator('#main').evaluate(n=>n===document.activeElement),true);
 });
 await check('隐藏原文参与全文和词形检索，关联文档不参与，中文列表不渲染原文',async()=>{
  await page.locator('#search').fill('ORCHESTRATOR');
  assert.equal(await page.locator('.card').count(),1);
  assert.equal(await page.locator('.card').getAttribute('data-skill-id'),'ecc/native/alpha');
  assert.doesNotMatch(await page.locator('.card').innerText(),/Orchestrating|hidden-search-token|Original description/);
  assert.equal(await page.locator('.card script,.card img,.card [onclick]').count(),0);
  assert.equal(await page.evaluate(()=>globalThis.readerXss),undefined);
  await page.locator('#search').fill('orchestration 架构');assert.equal(await page.locator('.card').count(),1);
  await page.locator('.card').getByRole('button',{name:'安全',exact:true}).click();
  assert.equal(await page.locator('.card').count(),1);
  await page.locator('#search').fill('reference-only-needle');assert.equal(await page.locator('.card').count(),0);
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();
  assert.equal(await page.locator('.card').count(),4);
 });
 await check('独立折叠、模块与下拉同步、来源库存',async()=>{
  await page.getByRole('button',{name:'展开 ECC 分类',exact:true}).click();
  assert.equal(await page.locator('.card').count(),4);
  await page.getByRole('button',{name:'ECC 模块 · 3',exact:true}).click();
  assert.equal(await page.locator('#provider').inputValue(),'ecc');assert.equal(await page.locator('.card').count(),3);
  await page.locator('#provider').selectOption('cyto');assert.equal(await page.locator('.card').count(),1);
  assert.match(await page.getByRole('button',{name:'ECC 模块 · 3',exact:true}).innerText(),/3/);
  await page.getByRole('button',{name:'全部技能 · 4',exact:true}).click();
 });
 await check('标签交集、搜索、空结果及清空',async()=>{
  await page.locator('.tag-filter summary').click();
  await page.locator('.tag-options').getByRole('button',{name:'审查',exact:true}).click();assert.equal(await page.locator('.card').count(),3);
  await page.locator('.tag-options').getByRole('button',{name:'安全',exact:true}).click();assert.equal(await page.locator('.card').count(),2);
  await page.locator('#search').fill('不存在的技能');assert.equal(await page.locator('.card').count(),0);
  assert.equal(await page.getByRole('heading',{name:'没有匹配的技能',exact:true}).count(),1);
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();assert.equal(await page.locator('.card').count(),4);
  await page.locator('#search').fill('source-command-demo');assert.equal(await page.locator('.card').count(),1);
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();
 });
 await check('工作流阶段并集、跨流程替换、键盘取消、组合和刷新恢复',async()=>{
  const stage=id=>page.locator(`[data-stage="${id}"]`);
  const disclosure=page.locator('.workflow-filter');
  assert.equal(await disclosure.getAttribute('open'),null);
  assert.equal(await page.locator('.workflow-arrow').count(),0);
  await disclosure.locator('summary').focus();await page.keyboard.press('Enter');
  assert.notEqual(await disclosure.getAttribute('open'),null);
  await stage('development-review').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('.card').count(),3);
  assert.equal(await stage('development-review').getAttribute('aria-pressed'),'true');
  await disclosure.locator('summary').click();
  assert.equal(await page.locator('.card').count(),3);
  assert.equal(await page.getByRole('button',{name:'取消阶段筛选',exact:true}).isVisible(),true);
  await disclosure.locator('summary').click();
  await page.locator('.tag-options').getByRole('button',{name:'安全',exact:true}).click();
  assert.equal(await page.locator('.card').count(),2);
  await stage('management-accept').click();assert.equal(await page.locator('.card').count(),2);
  assert.equal(await page.locator('.stage-button[aria-pressed="true"]').count(),1);
  await page.locator('#provider').selectOption('ecc');assert.equal(await page.locator('.card').count(),1);
  await page.locator('#search').fill('架构');await page.reload();await page.locator('.card').waitFor();
  assert.equal(await stage('management-accept').getAttribute('aria-pressed'),'true');
  assert.equal(await disclosure.getAttribute('open'),null);
  assert.equal(await page.locator('.card').count(),1);
  await disclosure.locator('summary').click();
  await page.getByRole('button',{name:'全部技能 · 4',exact:true}).click();
  assert.equal(await stage('management-accept').getAttribute('aria-pressed'),'true');
  assert.equal(await disclosure.getAttribute('open'),null);
  await disclosure.locator('summary').click();
  await stage('development-build').click();assert.equal(await page.locator('.card').count(),0);
  await page.getByRole('button',{name:'取消阶段',exact:true}).click();assert.equal(await page.locator('.card').count(),1);
  await stage('development-review').click();await page.getByRole('button',{name:'取消阶段筛选',exact:true}).click();
  assert.equal(await page.locator('.stage-button[aria-pressed="true"]').count(),0);
  await stage('development-review').click();await stage('development-review').click();
  assert.equal(await page.locator('.stage-button[aria-pressed="true"]').count(),0);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.ok((await stage('development-release').boundingBox()).height>=44);
  await stage('development-review').click();await page.screenshot({path:path.join(reportDir,'workflow-mobile-fixture.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();
  assert.equal(await page.locator('.card').count(),4);
  assert.equal(await page.locator('.stage-button[aria-pressed="true"]').count(),0);
 });
 await check('刷新保留有效筛选与展开状态',async()=>{
  await page.locator('#provider').selectOption('ecc');await page.locator('#search').fill('架构');
  await page.reload();await page.locator('.card').first().waitFor();
  assert.equal(await page.locator('#provider').inputValue(),'ecc');assert.equal(await page.locator('#search').inputValue(),'架构');
  assert.equal(await page.getByRole('button',{name:'收起 ECC 分类',exact:true}).getAttribute('aria-expanded'),'true');
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();
 });
 await check('明确详情入口支持键盘、新标签页、手机点击并保留列表筛选',async()=>{
  await page.locator('#provider').selectOption('ecc');await page.locator('#search').fill('架构');
  await page.locator('.card').getByRole('button',{name:'安全',exact:true}).click();
  const entry=page.getByRole('link',{name:'查看详情与原文',exact:true});
  assert.equal(await entry.getAttribute('href'),await page.locator('.skill-link').getAttribute('href'));
  assert.equal(await entry.getAttribute('target'),null);
  await entry.focus();await page.keyboard.press('Enter');await page.locator('.markdown h1').waitFor();
  assert.equal(await page.getByRole('heading',{name:'完整技能原文',exact:true}).count(),1);
  await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();await page.locator('.card').waitFor();
  assert.equal(await page.locator('#search').inputValue(),'架构');assert.equal(await page.locator('#provider').inputValue(),'ecc');
  assert.match(await page.locator('.active-filters').innerText(),/标签：安全/);
  const opened=context.waitForEvent('page');await page.getByRole('link',{name:'查看详情与原文',exact:true}).click({modifiers:['Control']});
  const detailTab=await opened;try{await detailTab.locator('.detail-title').waitFor();assert.equal(await detailTab.locator('.detail-title').innerText(),'架构安全审查');}finally{await detailTab.close();}
  await page.setViewportSize({width:390,height:844});
  assert.ok((await page.getByRole('link',{name:'查看详情与原文',exact:true}).boundingBox()).height>=44);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('link',{name:'查看详情与原文',exact:true}).click();await page.locator('.markdown h1').waitFor();
  await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();await page.locator('.card').waitFor();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();assert.equal(await page.locator('.card').count(),4);
 });
 await check('完整长文、Markdown排版、复制与深链刷新',async()=>{
  await page.locator('[data-skill-id="ecc/native/alpha"] .skill-link').click();await page.locator('.markdown h1').waitFor();
  assert.equal(await page.locator('.markdown').getByText('正文结束标记',{exact:true}).count(),1);
  assert.equal(await page.locator('.markdown table').count(),1);assert.equal(await page.locator('.markdown pre code').count(),1);
  assert.ok((await page.locator('.markdown').innerText()).length>1000);
  await page.getByRole('button',{name:'复制调用名',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'ecc:alpha');
  await page.reload();await page.locator('.markdown h1').waitFor();assert.match(await page.locator('.detail-title').innerText(),/架构安全审查/);
 });
 await check('Markdown脚本/事件/危险URL/远程媒体不执行',async()=>{
  assert.equal(await page.locator('.markdown script,.markdown img,.markdown iframe,.markdown [onclick],.markdown [onerror]').count(),0);
  assert.equal(await page.locator('.markdown a[href^="javascript:"]').count(),0);
  assert.equal(await page.evaluate(()=>globalThis.readerXss),undefined);
  assert.deepEqual(externalRequests,[]);
  assert.equal(await page.getByRole('link',{name:'外部资料',exact:true}).getAttribute('rel'),'noopener noreferrer');
 });
 await check('两层关联文档逐层返回',async()=>{
  await page.locator('.references').getByRole('link',{name:'第一篇',exact:true}).click();await page.getByRole('heading',{name:'第一篇关联文档',exact:true}).first().waitFor();
  await page.locator('.references').getByRole('link',{name:'第二篇',exact:true}).click();await page.getByRole('heading',{name:'第二篇关联文档',exact:true}).first().waitFor();
  await page.getByRole('link',{name:'← 返回前一篇文档',exact:true}).click();await page.getByRole('heading',{name:'第一篇关联文档',exact:true}).first().waitFor();
  await page.getByRole('link',{name:'← 返回前一篇文档',exact:true}).click();await page.locator('.detail-title').waitFor();assert.equal(await page.locator('.detail-title').innerText(),'架构安全审查');
 });
 await check('390px手机导航与长文不横向溢出',async()=>{
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'技能导航',exact:true}).click();assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'false');
  await page.screenshot({path:path.join(reportDir,'mobile-fixture.png'),fullPage:true});
 });
 await check('默认字体与200%布局空间',async()=>{
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).fontSize),'20px');
  await page.setViewportSize({width:720,height:500});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('.markdown').evaluate(n=>getComputedStyle(n).fontSize),'20px');
 });
 await check('移除来源后仅保留ECC导航并恢复旧筛选',async()=>{
  sources.splice(1);
  await writeFile(noteFile,JSON.stringify(notes.filter(n=>n.id.startsWith('ecc/'))));
  await page.evaluate(()=>localStorage.setItem('skill-reader.preferences.v1',JSON.stringify({filters:{provider:'cyto',category:'开发',query:'架构',tags:['审查','安全']},expanded:{cyto:true,ecc:true}})));
  await page.goto(base);await page.locator('.card').first().waitFor();
  assert.deepEqual(await page.locator('#provider option').evaluateAll(nodes=>nodes.map(n=>n.value)),['','ecc']);
  assert.equal(await page.locator('#provider').inputValue(),'');
  assert.equal(await page.locator('#search').inputValue(),'架构');
  assert.equal(await page.locator('.card').count(),1);
  assert.equal(await page.getByRole('button',{name:'ECC 模块 · 3',exact:true}).count(),1);
  assert.doesNotMatch(await page.locator('#navigation').innerText(),/Cyto/);
  assert.deepEqual(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).expanded)),['ecc']);
  await page.getByRole('button',{name:'清除全部筛选',exact:true}).first().click();
  assert.equal(await page.locator('.card').count(),3);
  await page.getByRole('button',{name:'ECC 模块 · 3',exact:true}).click();
  assert.equal(await page.locator('.card').count(),3);
 });
 await check('已移除来源的旧详情返回不可用提示并可回到列表',async()=>{
  await page.goto(base+'/#/skills/'+encodeURIComponent('cyto/native/alpha'));
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(),/未找到技能/);
  assert.equal(await page.locator('.markdown').count(),0);
  await page.getByRole('button',{name:'返回技能列表',exact:true}).click();
  await page.locator('.card').first().waitFor();
  assert.equal(await page.locator('.card').count(),3);
 });
 await checkDevelopmentGuide(page,check,reportDir,base);
 await check('来源文件内容不变且页面无运行错误',async()=>{
  for(const [file,raw] of sourceFiles)assert.equal(await readFile(file,'utf8'),raw);
  assert.deepEqual(errors,[]);
 });
 await checkEmbeddedGuide(browser,check,reportDir);
 const report={status:'passed',browser:browser.version(),platform:process.platform,node:process.version,checks,externalRequests:externalRequests.length,errors,windowsEdge:'not available; requires Windows verification',zoom:'720 CSS px available space only; native browser zoom not verified'};
 await writeFile(path.join(reportDir,'e2e.json'),JSON.stringify(report,null,2)+'\n');
 console.log(`浏览器验收通过：${checks.length} 项（独立测试浏览器）`);
} catch(error) {
 await writeFile(path.join(reportDir,'e2e.json'),JSON.stringify({status:'failed',checks,error:error.message},null,2)+'\n');
 throw error;
} finally {
 await browser?.close();await new Promise(resolve=>server.close(resolve));await rm(work,{recursive:true,force:true});
}
