import {readFile,writeFile,readdir,lstat,readlink,realpath,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const digest=value=>createHash('sha256').update(value).digest('hex');
const config=JSON.parse(await readFile(process.env.SKILL_READER_CONFIG||'.local/sources.json','utf8'));
const sources=[];
for(const source of config.sources){
 const installed=source.type==='installed-skills';
 const approved=installed?source.skills:source.entries?.map(entry=>entry.directory);
 if(!Array.isArray(approved)||!approved.length||approved.some(name=>typeof name!=='string'||!name||path.isAbsolute(name)||name.includes('\\')||name.split('/').some(part=>!part||part==='.'||part==='..')))throw new Error('基线只接受明确批准的安全来源目录');
 if(source.type!==undefined&&!['installed-skills','plugin'].includes(source.type))throw new Error('不支持的来源类型');
 const root=await realpath(source.root);const entries={};
 async function walk(relative){
  const file=path.join(root,relative);const info=await lstat(file);
  if(info.isSymbolicLink())entries[relative]={mode:info.mode,link:await readlink(file)};
  else if(info.isDirectory()){
   entries[relative]={mode:info.mode};
   for(const name of (await readdir(file)).sort())await walk(path.join(relative,name));
  }else if(info.isFile())entries[relative]={mode:info.mode,sha256:digest(await readFile(file))};
  else throw new Error('技能来源含不支持的文件类型');
 }
 if(!installed)await walk('.codex-plugin/plugin.json');
 for(const name of [...new Set(approved)].sort())await walk(name);
 sources.push({id:source.id,type:installed?'installed-skills':'plugin',root,configuredRoot:source.root,version:source.version,entries});
}
const current={schema:1,type:'configured-sources',sources};
const file='.local/source-baseline.json';
if(process.argv[2]==='record'){
 await mkdir('.local',{recursive:true});
 await writeFile(file,JSON.stringify(current,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log('已创建批准来源的技能与附件只读基线；已有基线禁止覆盖');
}else{
 const baseline=JSON.parse(await readFile(file,'utf8'));
 if(JSON.stringify(baseline)!==JSON.stringify(current))throw new Error('批准来源的内容、权限、路径或名单已变化；不会修改来源或覆盖基线');
 console.log(`批准来源基线一致：${sources.length} 个来源，${sources.reduce((n,s)=>n+Object.keys(s.entries).length,0)} 个文件及目录`);
}
