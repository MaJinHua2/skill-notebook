import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {GUIDES,GUIDE_MIME,guideById} from '../../web/guides-config.mjs';

test('guide configuration has only two stable IDs and exact public asset sets',()=>{
 assert.deepEqual(GUIDES.map(g=>g.id),['multi-agent-development','mattpocock-skills']);
 assert.deepEqual(guideById('multi-agent-development').files,['index.html','guide.css','guide.js']);
 assert.deepEqual(guideById('mattpocock-skills').files,['index.html','guide.css','guide.js','source-manifest.json','LICENSE.txt']);
 assert.equal(guideById('mattpocock-skills').name,'Mattpocock Skills 指南');
 assert.equal(guideById('unknown'),undefined);
 for(const guide of GUIDES)for(const name of guide.files)assert.equal(typeof GUIDE_MIME[name],'string');
});

test('build copies each guide allowlisted asset byte-for-byte without publishing sibling files',async t=>{
 const work=await mkdtemp(path.join(tmpdir(),'reader-guide-build-'));
 t.after(()=>rm(work,{recursive:true,force:true}));
 await mkdir(path.join(work,'web'),{recursive:true});
 await writeFile(path.join(work,'web/app.mjs'),'console.log("fixture");');
 await writeFile(path.join(work,'web/index.html'),'<main>fixture</main>');
 for(const guide of GUIDES){
  const dir=path.join(work,'web/guides',guide.id);await mkdir(dir,{recursive:true});
  for(const name of guide.files)await writeFile(path.join(dir,name),`${guide.id}/${name}\n中文 UTF-8\n`);
  await writeFile(path.join(dir,'private.md'),'do not publish');
 }
 execFileSync(process.execPath,[fileURLToPath(new URL('../../scripts/build.mjs',import.meta.url))],{cwd:work,stdio:'pipe'});
 for(const guide of GUIDES){
  const relative=path.join('guides',guide.id);
  assert.deepEqual((await readdir(path.join(work,'dist',relative))).sort(),[...guide.files].sort());
  for(const name of guide.files)assert.deepEqual(await readFile(path.join(work,'dist',relative,name)),await readFile(path.join(work,'web',relative,name)));
 }
});
