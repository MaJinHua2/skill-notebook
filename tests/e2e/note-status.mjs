import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createApp} from '../../src/server/app.mjs';

export async function checkNoteStatus(browser,check,reportDir){
 const work=await mkdtemp(path.resolve('.local/note-status-e2e-'));
 let server,context;
 try{
  const sources=[],notes=[],files=[];
  for(const provider of ['ecc','other']){
   const root=path.join(work,provider);await mkdir(path.join(root,'.codex-plugin'),{recursive:true});
   await writeFile(path.join(root,'.codex-plugin','plugin.json'),JSON.stringify({name:provider,version:'1.0.0',skills:'./skills'}));
   sources.push({id:provider,label:provider==='ecc'?'ECC':'Other',root,version:'1.0.0',entries:[{kind:'native',directory:'skills'}]});
   for(const [slug,status] of provider==='ecc'?[['alpha','stale'],['beta','stale'],['gamma','missing'],['delta','verified']]:[['alpha','stale']]){
    const raw=`---\nname: ${slug}\ndescription: Note status fixture\n---\n# 完整原文\n\n当前正文 ${provider}/${slug}\n`;
    const file=path.join(root,'skills',slug,'SKILL.md');await mkdir(path.dirname(file),{recursive:true});await writeFile(file,raw);
    if(status!=='missing')notes.push({id:`${provider}/native/${slug}`,callName:`${provider}:${slug}`,nameZh:status==='verified'?'已核对条目':`待复核条目 ${slug}`,summaryZh:'中文用途说明',scenariosZh:['对照原文核对','按场景阅读'],tags:['测试'],category:'开发',version:'1.0.0',sourceHash:createHash('sha256').update(status==='stale'?raw+'old':raw).digest('hex')});
    files.push({id:`${provider}/native/${slug}`,raw});
   }
  }
  notes.push({...notes[0],id:'ecc/native/orphan',callName:'ecc:orphan'});
  const noteFile=path.join(work,'notes.json');await writeFile(noteFile,JSON.stringify(notes));
  server=await createApp({config:{schema:1,sources},notesFiles:[noteFile],webRoot:path.resolve('dist')});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.locator('.card').first().waitFor();
  const ecc=page.locator('.note-status[data-provider="ecc"]');
  await check('中文说明异常按来源汇总、默认折叠，并保留普通诊断',async()=>{
   assert.equal(await page.locator('.note-status').count(),2);
   assert.equal(await ecc.getAttribute('open'),null);
   assert.match(await ecc.locator('summary').innerText(),/ECC.*全库.*2 项待复核.*1 项待整理/);
   assert.match(await page.locator('.diagnostics').innerText(),/有中文说明未找到对应技能/);
   assert.doesNotMatch(await page.locator('.diagnostics').innerText(),/部分中文说明来源已变化/);
   await ecc.locator('summary').focus();await page.keyboard.press('Enter');
   assert.equal(await ecc.locator('[data-status="stale"] a').count(),2);
   assert.equal(await ecc.locator('[data-status="missing"] a').count(),1);
   assert.equal(await ecc.locator('[data-status="missing"] a').innerText(),'ecc:gamma');
  });
  await check('全库告警与当前筛选分开，问题项可定位并保留原筛选',async()=>{
   await page.locator('#search').fill('已核对条目');
   assert.equal(await page.locator('.card').count(),1);
   assert.equal(await page.locator('.card .notice.warning').count(),0);
   assert.notEqual(await ecc.getAttribute('open'),null);
   assert.match(await ecc.locator('summary').innerText(),/2 项待复核.*1 项待整理/);
   const link=ecc.locator('[data-status="stale"] a').first();
   const id=decodeURIComponent((await link.getAttribute('href')).split('/').at(-1));
   await link.click();await page.locator('.markdown').waitFor();
   assert.match(await page.locator('#main .notice.warning').innerText(),/说明待复核/);
   assert.match(await page.locator('.markdown').innerText(),new RegExp(files.find(f=>f.id===id).raw.split('当前正文 ')[1].trim()));
   await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();await page.locator('#search').waitFor();
   assert.equal(await page.locator('#search').inputValue(),'已核对条目');
   await ecc.locator('summary').click();await ecc.locator('[data-status="missing"] a').click();await page.locator('.markdown').waitFor();
   assert.match(await page.locator('#main .notice').innerText(),/中文说明待整理/);
   await page.getByRole('link',{name:'← 返回技能列表',exact:true}).click();await page.locator('#search').waitFor();
  });
  await check('窄屏汇总不横向溢出，刷新后按当前资料更新或清空',async()=>{
   await page.setViewportSize({width:390,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.ok((await ecc.boundingBox()).height<180);
   await page.screenshot({path:path.join(reportDir,'note-status-mobile.png'),fullPage:true});
   for(const file of files){
    const note=notes.find(n=>n.id===file.id);
    if(note)note.sourceHash=createHash('sha256').update(file.raw).digest('hex');
    else notes.push({...notes[0],id:file.id,callName:file.id.replace('/native/',':'),sourceHash:createHash('sha256').update(file.raw).digest('hex')});
   }
   await writeFile(noteFile,JSON.stringify(notes.filter(n=>!n.id.endsWith('/orphan'))));
   await page.getByRole('button',{name:'刷新资料',exact:true}).click();await page.locator('.note-status').first().waitFor({state:'detached'});
   assert.equal(await page.locator('.note-status').count(),0);
   assert.equal(await page.locator('.diagnostics .notice').count(),0);
   assert.deepEqual(errors,[]);
  });
 }finally{
  await context?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(work,{recursive:true,force:true});
 }
}
