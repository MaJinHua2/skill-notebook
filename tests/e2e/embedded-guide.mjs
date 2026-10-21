import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,unlink} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createApp} from '../../src/server/app.mjs';
import {EMBEDDED_GUIDE} from '../../web/embedded-guide.mjs';
import {routeFor} from '../../web/state.mjs';

// Separate sources and browser context keep the original four-skill regression fixture intact.
export async function checkEmbeddedGuide(browser,check,reportDir){
 const work=await mkdtemp(path.resolve('.local/guide-e2e-'));
 let server,context;
 try{
  const sources=[],notes=[];
  for(const provider of ['ecc','other']){
   const root=path.join(work,provider);await mkdir(path.join(root,'.codex-plugin'),{recursive:true});
   await writeFile(path.join(root,'.codex-plugin','plugin.json'),JSON.stringify({name:provider,version:'1.0.0',skills:'./skills'}));
   const entries=[{kind:'native',directory:'skills'}];
   if(provider==='ecc')entries.push({kind:'migrated',directory:'.codex-plugin/migrated-command-skills'});
   sources.push({id:provider,label:provider==='ecc'?'ECC':'Other',root,version:'1.0.0',entries});
   for(const {slug,label} of EMBEDDED_GUIDE){
    for(const {kind,directory} of entries){
     const dir=path.join(root,directory,slug);await mkdir(dir,{recursive:true});
     const raw=`---\nname: ${slug}\ndescription: Guide fixture\n---\n# 完整原文\n\n原文证据 ${provider}/${kind}/${slug}\n`;
     await writeFile(path.join(dir,'SKILL.md'),raw);
     notes.push({id:`${provider}/${kind}/${slug}`,callName:`${provider}:${slug}`,nameZh:label,summaryZh:'中文用途说明',scenariosZh:['中文使用场景'],tags:['测试'],category:'开发',version:'1.0.0',sourceHash:createHash('sha256').update(raw).digest('hex')});
    }
   }
  }
  const noteFile=path.join(work,'notes.json');await writeFile(noteFile,JSON.stringify(notes));
  server=await createApp({config:{schema:1,sources},notesFiles:[noteFile],webRoot:path.resolve('dist')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();const errors=[];const detailRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{const url=new URL(request.url());if(url.pathname.startsWith('/api/skills/'))detailRequests.push(decodeURIComponent(url.pathname.slice('/api/skills/'.length)));});
  const openGuide=async()=>{const details=page.locator('.workflow-filter');if(await details.getAttribute('open')===null)await details.locator('summary').click();};
  const item=entry=>page.locator(`[data-guide-id="${entry.id}"]`);
  await page.goto(base);await page.locator('.card').first().waitFor();
  await check('嵌入式引导默认收起、十项顺序与桌面两列',async()=>{
   assert.equal(await page.locator('.workflow-filter').getAttribute('open'),null);
   assert.equal(await page.locator('.workflow-filter summary').innerText(),'按工作流程阶段');
   await openGuide();
   assert.deepEqual(await page.locator('.embedded-guide-stage').allTextContents(),EMBEDDED_GUIDE.map(e=>e.label));
   assert.deepEqual(await page.locator('.embedded-guide-link').allTextContents(),EMBEDDED_GUIDE.map(e=>e.slug));
   assert.deepEqual(await page.locator('.embedded-guide-item>p:first-of-type').allTextContents(),EMBEDDED_GUIDE.map(e=>e.description));
   assert.equal(await page.locator('.stage-button').count(),14);
   const first=await item(EMBEDDED_GUIDE[0]).boundingBox(),second=await item(EMBEDDED_GUIDE[1]).boundingBox();
   assert.equal(first.y,second.y);assert.ok(second.x>first.x);
   await page.screenshot({path:path.join(reportDir,'embedded-guide-desktop.png'),fullPage:true});
  });
  await check('十项逐一调用精确详情接口，排除其他来源与迁移同名项',async()=>{
   for(const entry of EMBEDDED_GUIDE){
    await openGuide();const count=detailRequests.length;
    await item(entry).getByRole('link',{name:entry.slug,exact:true}).click();
    await page.locator('.markdown h1').waitFor();
    assert.equal(new URL(page.url()).hash,routeFor('skills',entry.id));
    assert.deepEqual(detailRequests.slice(count),[entry.id]);
    assert.equal(await page.locator('.detail-title').innerText(),entry.label);
    assert.match(await page.locator('.learning-panel').innerText(),/中文用途说明/);
    assert.match(await page.locator('.markdown').innerText(),new RegExp(`原文证据 ${entry.id}`));
    await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();
    await page.locator('#search').waitFor();
   }
  });
  const filters={provider:'other',category:'开发',query:'零结果限定词',tags:['测试'],stage:'development-build'};
  await check('零结果及全部筛选条件不影响引导直达，返回完整保留条件',async()=>{
   await page.evaluate(value=>localStorage.setItem('skill-reader.preferences.v1',JSON.stringify({filters:value,expanded:{other:true}})),filters);
   await page.reload();await page.locator('.empty-state').waitFor();
   assert.equal(await page.locator('.card').count(),0);
   await openGuide();await item(EMBEDDED_GUIDE[0]).getByRole('link').click();await page.locator('.markdown h1').waitFor();
   await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();await page.locator('#search').waitFor();
   assert.equal(await page.locator('#search').inputValue(),filters.query);
   assert.equal(await page.locator('#provider').inputValue(),filters.provider);
   assert.equal(await page.locator('.card').count(),0);
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-reader.preferences.v1')).filters),filters);
   assert.equal(await page.locator('[data-stage="development-build"]').getAttribute('aria-pressed'),'true');
  });
  await check('技能链接支持键盘与新标签页，手机单列且触摸目标不小于44px',async()=>{
   await openGuide();const link=item(EMBEDDED_GUIDE[1]).getByRole('link');
   await link.focus();await page.keyboard.press('Enter');await page.locator('.markdown h1').waitFor();
   assert.equal(new URL(page.url()).hash,routeFor('skills',EMBEDDED_GUIDE[1].id));
   await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();await openGuide();
   const popupPromise=context.waitForEvent('page');
   await item(EMBEDDED_GUIDE[2]).getByRole('link').click({modifiers:['ControlOrMeta']});
   const popup=await popupPromise;await popup.locator('.markdown h1').waitFor();
   assert.equal(new URL(popup.url()).hash,routeFor('skills',EMBEDDED_GUIDE[2].id));await popup.close();
   await page.setViewportSize({width:390,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const first=await item(EMBEDDED_GUIDE[0]).boundingBox(),second=await item(EMBEDDED_GUIDE[1]).boundingBox();
   assert.equal(first.x,second.x);assert.ok(second.y>first.y);
   for(const entry of EMBEDDED_GUIDE)assert.ok((await item(entry).getByRole('link').boundingBox()).height>=44);
   await page.screenshot({path:path.join(reportDir,'embedded-guide-mobile.png'),fullPage:true});
  });
  await check('详情接口失败沿用错误与重试界面',async()=>{
   const entry=EMBEDDED_GUIDE[3],endpoint=`**/api/skills/${encodeURIComponent(entry.id)}`;
   await page.route(endpoint,route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'模拟详情读取失败'})}));
   await item(entry).getByRole('link').click();await page.getByRole('alert').waitFor();
   assert.match(await page.getByRole('alert').innerText(),/模拟详情读取失败/);
   await page.unroute(endpoint);await page.getByRole('button',{name:'重试',exact:true}).click();
   await page.locator('.markdown h1').waitFor();
   assert.match(await page.locator('.markdown').innerText(),new RegExp(entry.id));
  });
  await check('缺失目标禁用链接且不回退到其他来源或迁移同名技能',async()=>{
   const entry=EMBEDDED_GUIDE[0];await unlink(path.join(work,'ecc','skills',entry.slug,'SKILL.md'));
   await page.goto(base);await page.locator('#search').waitFor();await openGuide();
   assert.equal(await page.locator('.embedded-guide-item').count(),10);
   assert.equal(await item(entry).getByRole('link').count(),0);
   assert.equal(await item(entry).locator('[aria-disabled="true"]').innerText(),entry.slug);
   assert.match(await item(entry).innerText(),/当前来源未提供该技能/);
   assert.equal(await page.locator('.embedded-guide a').count(),9);
   assert.deepEqual(errors,[]);
  });
 }finally{
  await context?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(work,{recursive:true,force:true});
 }
}
