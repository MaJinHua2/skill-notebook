import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

test('source baseline detects byte changes, refuses overwrites and ignores unapproved siblings',async t=>{
 const work=await mkdtemp(path.join(tmpdir(),'reader-baseline-'));
 t.after(()=>rm(work,{recursive:true,force:true}));
 const root=path.join(work,'skills');const skill=path.join(root,'sample','SKILL.md');
 await mkdir(path.dirname(skill),{recursive:true});await mkdir(path.join(work,'.local'));
 await writeFile(skill,'original source bytes');
 await writeFile(path.join(work,'.local','sources.json'),JSON.stringify({schema:1,sources:[{id:'mattpocock',type:'installed-skills',root,version:'installed',skills:['sample']}]}));
 const script=fileURLToPath(new URL('../../scripts/source-baseline.mjs',import.meta.url));
 const run=command=>spawnSync(process.execPath,[script,command],{cwd:work,encoding:'utf8',env:{...process.env,SKILL_READER_CONFIG:path.join(work,'.local','sources.json')}});
 assert.equal(run('record').status,0);
 const baseline=await readFile(path.join(work,'.local','source-baseline.json'),'utf8');
 assert.equal(run('check').status,0);
 assert.notEqual(run('record').status,0);
 assert.equal(await readFile(path.join(work,'.local','source-baseline.json'),'utf8'),baseline);
 await mkdir(path.join(root,'unapproved'));await writeFile(path.join(root,'unapproved','SKILL.md'),'not approved');
 assert.equal(run('check').status,0);
 await writeFile(skill,'changed source bytes');assert.notEqual(run('check').status,0);
 await writeFile(skill,'original source bytes');assert.equal(run('check').status,0);
});

test('ECC plugin baseline includes approved migrated skills, attachments and manifest',async t=>{
 const work=await mkdtemp(path.join(tmpdir(),'reader-ecc-baseline-'));
 t.after(()=>rm(work,{recursive:true,force:true}));
 const root=path.join(work,'ecc');const manifest=path.join(root,'.codex-plugin','plugin.json');
 const native=path.join(root,'skills','sample');const migrated=path.join(root,'.codex-plugin','migrated-command-skills','source-command-demo');
 await mkdir(native,{recursive:true});await mkdir(migrated,{recursive:true});await mkdir(path.join(work,'.local'));
 await writeFile(manifest,JSON.stringify({name:'ecc',version:'2.2.3',skills:'./skills'}));
 await writeFile(path.join(native,'SKILL.md'),'native bytes');await writeFile(path.join(native,'guide.md'),'attachment bytes');
 await writeFile(path.join(migrated,'SKILL.md'),'migrated bytes');
 const config=path.join(work,'.local','sources.json');
 await writeFile(config,JSON.stringify({schema:1,sources:[{id:'ecc',root,version:'2.2.3',entries:[{kind:'native',directory:'skills'},{kind:'migrated',directory:'.codex-plugin/migrated-command-skills'}]}]}));
 const script=fileURLToPath(new URL('../../scripts/source-baseline.mjs',import.meta.url));
 const run=command=>spawnSync(process.execPath,[script,command],{cwd:work,encoding:'utf8',env:{...process.env,SKILL_READER_CONFIG:config}});
 assert.equal(run('record').status,0);assert.equal(run('check').status,0);
 for(const file of [manifest,path.join(native,'guide.md'),path.join(migrated,'SKILL.md')]){
  const original=await readFile(file);await writeFile(file,'modified');assert.notEqual(run('check').status,0);await writeFile(file,original);
 }
 assert.equal(run('check').status,0);
});
