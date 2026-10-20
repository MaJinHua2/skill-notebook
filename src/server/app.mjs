import http from 'node:http';
import { realpath, readdir, open, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parseDocument } from 'yaml';
import {createAccessPolicy} from './network.mjs';

const MAX_BYTES = 2 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const inside = (root, file) => file === root || (!path.relative(root, file).startsWith('..' + path.sep) && path.relative(root,file) !== '..' && !path.isAbsolute(path.relative(root,file)));
const identifier = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]*$/i.test(value);
const safeError = (code='INVALID_SOURCE') => Object.assign(new Error('来源配置或文件无法安全读取'),{code});
function relative(value) {
  if(typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || path.isAbsolute(value)) throw safeError();
  const clean = value.replace(/^\.\//,'').replace(/\/$/,'');
  if(!clean || clean.split('/').some(x=>!x || x==='.' || x==='..')) throw safeError();
  return clean;
}

// Recheck real paths before and after opening; never follow a final-file symlink.
async function checkedRead(root, file, boundaries=[], expected) {
  const verify = async () => {
    if(await realpath(root)!==root) throw safeError();
    const actual = await realpath(file);
    if(!inside(root,actual) || (expected && actual!==expected)) throw safeError();
    for(const boundary of boundaries) {
      if(await realpath(boundary)!==boundary || !inside(boundary,actual)) throw safeError();
    }
    return actual;
  };
  const actual = await verify();
  const handle = await open(actual,constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if(!info.isFile()) throw safeError();
    if(info.size>MAX_BYTES) throw safeError('FILE_TOO_LARGE');
    const buffer=Buffer.alloc(MAX_BYTES+1); let total=0;
    while(total<buffer.length) {
      const {bytesRead}=await handle.read(buffer,total,buffer.length-total,total);
      if(!bytesRead) break; total+=bytesRead;
    }
    if(total>MAX_BYTES) throw safeError('FILE_TOO_LARGE');
    if(await verify()!==actual) throw safeError();
    const now=await stat(actual);
    if(now.dev!==info.dev || now.ino!==info.ino) throw safeError();
    return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(buffer.subarray(0,total));
  } finally { await handle.close(); }
}

function parseSkill(raw, slug) {
  const match=/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw);
  if(!match) throw safeError('FRONTMATTER_INVALID');
  const doc=parseDocument(match[1],{uniqueKeys:true});
  if(doc.errors.length) throw safeError('FRONTMATTER_INVALID');
  let meta;
  try { meta=doc.toJS({maxAliasCount:30}); } catch { throw safeError('FRONTMATTER_INVALID'); }
  if(!meta || meta.name!==slug || typeof meta.description!=='string' || !meta.description.trim()) throw safeError('FRONTMATTER_INVALID');
  return {description:meta.description.trim(),body:raw.slice(match[0].length)};
}

async function readMetadata(root,id,version) {
  const metadata=JSON.parse(await checkedRead(root,path.join(root,'.codex-plugin','plugin.json')));
  if(metadata.name!==id || metadata.version!==version || !(typeof metadata.skills==='string' || Array.isArray(metadata.skills))) throw safeError('METADATA_MISMATCH');
  return metadata;
}

async function buildCatalog(config,notesFiles,approvedRoots) {
  if(config?.schema!==1 || !Array.isArray(config.sources) || !config.sources.length) throw safeError('CONFIG_INVALID');
  const diagnostics=[]; const records=new Map(); const sources=[];
  const diag=(source,code,message='来源文件未通过校验，请检查本地配置。')=>diagnostics.push({source,code,message});
  const seenRoots=new Map(), seenIds=new Set();
  for(const source of config.sources) {
    if(!identifier(source.id) || typeof source.label!=='string' || !source.label.trim() || typeof source.version!=='string' || !source.version || typeof source.root!=='string' || !path.isAbsolute(source.root) || !Array.isArray(source.entries) || !source.entries.length) throw safeError('CONFIG_INVALID');
    let root;
    try { root=await realpath(source.root); } catch { diag(source.id,'SOURCE_UNAVAILABLE','技能包不可用，请检查本地来源。'); continue; }
    const configuredRoot=path.resolve(source.root);
    if(approvedRoots.has(configuredRoot) && approvedRoots.get(configuredRoot)!==root) {
      diag(source.id,'SOURCE_CHANGED','技能包真实目录已变化，请重新核对来源配置。'); continue;
    }
    approvedRoots.set(configuredRoot,root);
    if(seenRoots.has(root)) {
      const prior=seenRoots.get(root);
      if(prior.version!==source.version || prior.id!==source.id || JSON.stringify(prior.entries)!==JSON.stringify(source.entries)) throw safeError('SOURCE_CONFLICT');
      continue;
    }
    if(seenIds.has(source.id)) throw safeError('SOURCE_CONFLICT');
    seenIds.add(source.id); seenRoots.set(root,source);
    const sourceInfo={id:source.id,label:source.label,version:source.version,count:0}; sources.push(sourceInfo);
    let metadata;
    try {
      metadata=await readMetadata(root,source.id,source.version);
    } catch(error) { diag(source.id,error.code==='FILE_TOO_LARGE'?error.code:'METADATA_MISMATCH','技能包名称、版本或入口定义不匹配。'); continue; }
    const declared=(Array.isArray(metadata.skills)?metadata.skills:[metadata.skills]).map(value=>{try{return relative(value);}catch{return null;}});
    const seenEntries=new Set();
    for(const entry of source.entries) {
      let entryRel,entryRoot;
      try {
        if(!identifier(entry.kind)) throw safeError();
        entryRel=relative(entry.directory);
        if(entry.kind==='native' && !declared.includes(entryRel)) throw safeError();
        if(entry.kind!=='native' && !(source.id==='ecc' && entry.kind==='migrated' && entryRel==='.codex-plugin/migrated-command-skills')) throw safeError();
        entryRoot=await realpath(path.join(root,entryRel));
        if(!inside(root,entryRoot)) throw safeError();
        const key=entry.kind+'\0'+entryRoot;
        if(seenEntries.has(key)) continue; seenEntries.add(key);
        const children=await readdir(entryRoot,{withFileTypes:true});
        for(const child of children.sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
          if(!child.isDirectory() && !child.isSymbolicLink()) continue;
          const slug=child.name;
          if(!identifier(slug)) { diag(source.id,'SKILL_NAME_INVALID'); continue; }
          try {
            const skillRoot=await realpath(path.join(entryRoot,slug));
            if(!inside(entryRoot,skillRoot)) throw safeError();
            // Keep the original configured path so parent-directory swaps are checked again on detail reads.
            const file=path.join(root,entryRel,slug,'SKILL.md'); const actual=await realpath(file);
            const raw=await checkedRead(root,file,[entryRoot,skillRoot],actual);
            const parsed=parseSkill(raw,slug);
            const id=`${source.id}/${entry.kind}/${slug}`;
            if(records.has(id)) throw safeError('SKILL_CONFLICT');
            const item={id,provider:source.id,providerLabel:source.label,kind:entry.kind,slug,version:source.version,callName:`${source.id}:${slug}`,description:parsed.description,searchText:parsed.body,sourceHash:hash(raw),nameZh:'',summaryZh:'',scenariosZh:[],tags:[],category:'',status:'missing'};
            records.set(id,{item,root,entryRoot,skillRoot,file,actual,metadataSkills:JSON.stringify(metadata.skills)}); sourceInfo.count++;
          } catch(error) { diag(source.id,error.code==='FILE_TOO_LARGE'?error.code:'SKILL_INVALID','一项技能的正文、名称或路径未通过校验。'); }
        }
      } catch { diag(source.id,'ENTRY_INVALID','技能入口不可用或超出批准范围。'); }
    }
  }

  const notes=new Map(); const duplicateNotes=new Set();
  for(const file of notesFiles) {
    let entries;
    try {
      const real=await realpath(file);
      entries=JSON.parse(await checkedRead(path.dirname(real),real));
      if(!Array.isArray(entries)) throw safeError();
    } catch(error) { if(error.code!=='ENOENT') diag('notes','NOTES_INVALID','中文学习说明无法读取或格式错误。'); continue; }
    for(const note of entries) {
      const valid=note && typeof note.id==='string' && typeof note.callName==='string' && typeof note.nameZh==='string' && note.nameZh.trim() && typeof note.summaryZh==='string' && note.summaryZh.trim() && Array.isArray(note.scenariosZh) && note.scenariosZh.length && note.scenariosZh.every(x=>typeof x==='string'&&x.trim()) && Array.isArray(note.tags) && note.tags.every(x=>typeof x==='string'&&x.trim()) && typeof note.category==='string' && typeof note.version==='string' && /^[a-f0-9]{64}$/.test(note.sourceHash);
      if(!valid) { diag('notes','NOTE_INVALID','一项中文学习说明不符合字段约定。'); continue; }
      if(notes.has(note.id)) { duplicateNotes.add(note.id); diag('notes','NOTE_DUPLICATE','存在重复中文说明，已拒绝关联。'); }
      notes.set(note.id,note);
    }
  }
  for(const [id,note] of notes) {
    const record=records.get(id);
    if(!record) { diag('notes','NOTE_ORPHAN','有中文说明未找到对应技能。'); continue; }
    if(duplicateNotes.has(id) || note.callName!==record.item.callName) { if(!duplicateNotes.has(id)) diag(record.item.provider,'NOTE_MISMATCH','中文说明调用名与技能不一致。'); continue; }
    for(const key of ['nameZh','summaryZh','scenariosZh','tags','category']) record.item[key]=note[key];
    record.item.status=note.version===record.item.version && note.sourceHash===record.item.sourceHash?'verified':'stale';
    if(record.item.status==='stale') diag(record.item.provider,'NOTE_STALE','部分中文说明来源已变化，需复核。');
  }
  return {records,sources,diagnostics};
}

export async function createApp({config,notesFiles=[],webRoot,allowedCidrs=[]}={}) {
  const allowRequest=createAccessPolicy(allowedCidrs);
  const approvedRoots=new Map();
  let catalog=await buildCatalog(config,notesFiles,approvedRoots);
  // Keep opaque IDs across explicit refreshes, so another open tab can still read valid references.
  const references=new Map();

  async function document(record, isSkill) {
    const metadata=await readMetadata(record.root,record.item.provider,record.item.version);
    if(JSON.stringify(metadata.skills)!==record.metadataSkills) throw safeError('METADATA_MISMATCH');
    const raw=await checkedRead(record.root,record.file,[record.entryRoot,record.skillRoot],record.actual);
    if(isSkill && hash(raw)!==record.item.sourceHash) throw safeError('SOURCE_CHANGED');
    const body=isSkill?parseSkill(raw,record.item.slug).body:raw;
    const refs=[]; const seen=new Set();
    // Only explicit local Markdown links are registered. Images and all remote URLs stay inert.
    for(const match of body.matchAll(/(?<!!)\[([^\]\n]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const label=match[1]; let target=match[2].replace(/^<|>$/g,'');
      if(/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('//')) continue;
      try {
        target=decodeURIComponent(target.split(/[?#]/)[0]);
        if(target.includes('%') || !/\.md$/i.test(target)) continue;
        target=relative(target);
        const file=path.resolve(path.dirname(record.file),target); const actual=await realpath(file);
        // References may be elsewhere in the approved package, but never outside it.
        await checkedRead(record.root,file,[],actual);
        const id=hash(record.item.provider+'\0'+path.relative(record.root,actual));
        if(seen.has(id)) continue; seen.add(id);
        references.set(id,{root:record.root,file,actual,entryRoot:record.root,skillRoot:record.root,item:record.item,metadataSkills:record.metadataSkills});
        refs.push({id,label});
      } catch { /* Unsupported or unsafe references are deliberately not registered. */ }
    }
    return {body,references:refs};
  }

  const assets=new Map([['/',['index.html','text/html; charset=utf-8']],['/index.html',['index.html','text/html; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/app.css',['app.css','text/css; charset=utf-8']]]);
  let assetRoot; try { assetRoot=await realpath(webRoot); } catch { assetRoot=null; }
  const server=http.createServer(async(req,res)=> {
    const send=(status,payload,type='application/json; charset=utf-8',headers={})=> {
      const body=typeof payload==='string'?payload:JSON.stringify(payload);
      res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",...headers});
      res.end(req.method==='HEAD'?'':body);
    };
    const fail=(status,code,message)=>send(status,{error:message,code});
    try {
      if(!allowRequest(req,server.address())) return fail(403,'FORBIDDEN','请求来源未获允许。');
      if(req.method!=='GET' && req.method!=='HEAD') return send(405,{error:'此阅读器仅支持读取。',code:'METHOD_NOT_ALLOWED'},undefined,{Allow:'GET, HEAD'});
      const url=new URL(req.url,'http://'+req.headers.host); const route=url.pathname;
      if(route==='/api/skills') {
        const refreshed=await buildCatalog(config,notesFiles,approvedRoots);
        catalog=refreshed;
        return send(200,{schema:1,sources:refreshed.sources,skills:[...refreshed.records.values()].map(x=>x.item),diagnostics:refreshed.diagnostics});
      }
      if(route.startsWith('/api/skills/')) {
        let id; try{id=decodeURIComponent(route.slice('/api/skills/'.length));}catch{return fail(404,'NOT_FOUND','未找到技能。');}
        const record=catalog.records.get(id); if(!record) return fail(404,'NOT_FOUND','未找到技能。');
        try { return send(200,{...record.item,...await document(record,true)}); } catch { return fail(404,'NOT_FOUND','技能正文或来源已变化，请刷新资料后重试。'); }
      }
      if(route.startsWith('/api/references/')) {
        const id=route.slice('/api/references/'.length); const record=references.get(id);
        if(!record) return fail(404,'NOT_FOUND','未找到关联文档。');
        try { const doc=await document(record,false); const title=/^#\s+(.+)$/m.exec(doc.body)?.[1] || '关联文档'; return send(200,{title,...doc}); } catch { return fail(404,'NOT_FOUND','关联文档已变化或无法安全读取。'); }
      }
      const asset=assets.get(route);
      if(asset && assetRoot) {
        try { return send(200,await checkedRead(assetRoot,path.join(assetRoot,asset[0])),asset[1]); } catch { return fail(404,'NOT_FOUND','页面资源不可用，请先构建前端。'); }
      }
      return fail(404,'NOT_FOUND','未找到资源。');
    } catch { return fail(500,'READ_ERROR','暂时无法读取内容。'); }
  });
  server.requestTimeout=15000; server.headersTimeout=10000;
  return server;
}
