import { readFile, writeFile, readdir, lstat, readlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const digest = value => createHash('sha256').update(value).digest('hex');
const settings = JSON.parse(await readFile('.local/protection.json', 'utf8'));
const run = (program, args) => execFileSync(program, args, { env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
async function filesUnder(root, relative = '') {
  const result = [];
  for (const name of (await readdir(path.join(root, relative))).sort()) {
    if (name === '.git') continue;
    const file = path.join(relative, name);
    const stat = await lstat(path.join(root, file));
    if (stat.isDirectory()) result.push(...await filesUnder(root, file));
    else result.push(file);
  }
  return result;
}
async function snapshot() {
  const result = {};
  for (const source of settings.roots) {
    const git = args => run('git', ['-C', source.root, ...args]);
    const files = source.git
      ? [...new Set(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard']).toString().split('\0').filter(Boolean))].sort()
      : await filesUnder(source.root);
    const entries = {};
    for (const file of files) {
      const name = path.join(source.root, file);
      try {
        const stat = await lstat(name);
        entries[file] = { mode: stat.mode, hash: digest(stat.isSymbolicLink() ? await readlink(name) : await readFile(name)) };
      } catch (error) { if (error.code === 'ENOENT') entries[file] = null; else throw error; }
    }
    result[source.id] = { entries };
    if (source.git) {
      result[source.id].head = git(['rev-parse', 'HEAD']).toString().trim();
      result[source.id].status = git(['status', '--porcelain=v1', '-z']).toString();
      result[source.id].index = digest(await readFile(path.join(source.root, '.git/index')));
    }
  }
  result.originalService = run('ss', ['-ltnp', '( sport = :3456 )']).toString();
  return result;
}
const current = await snapshot();
const sourceOnly = value => Object.fromEntries(Object.entries(value).filter(([key])=>key!=='originalService'));
if (process.argv[2] === 'record') {
  try { await writeFile('.local/source-baseline.json', JSON.stringify(current), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('基线已存在，禁止覆盖'); throw error; }
  console.log('已记录只读来源与原服务基线');
} else {
  const previous = JSON.parse(await readFile('.local/source-baseline.json', 'utf8'));
  let events=[];
  try { events=JSON.parse(await readFile('.local/service-restarts.json','utf8')); } catch(error) { if(error.code!=='ENOENT')throw error; }
  if(process.argv[2]==='record-service') {
    if(JSON.stringify(sourceOnly(current))!==JSON.stringify(sourceOnly(previous)))throw new Error('来源内容或Git基线有变化，不能记录服务重启');
    if(!current.originalService.includes('LISTEN'))throw new Error('原预览服务尚未监听');
    events.push({at:new Date().toISOString(),reason:'User requested preview restart',listener:current.originalService});
    await writeFile('.local/service-restarts.json',JSON.stringify(events,null,2)+'\n',{mode:0o600});
    console.log('来源基线未变；已另行记录用户授权的原预览重启，保留原始基线');
    process.exit(0);
  }
  if(events.length)previous.originalService=events.at(-1).listener;
  if (JSON.stringify(current) !== JSON.stringify(previous)) {
    for (const key of Object.keys(current)) {
      if (key === 'originalService') { if(current[key]!==previous[key]) console.error('原服务监听信息有变化'); continue; }
      const before=previous[key]||{}, after=current[key];
      const changed=[...new Set([...Object.keys(before.entries||{}),...Object.keys(after.entries||{})])].filter(file=>JSON.stringify(before.entries?.[file])!==JSON.stringify(after.entries?.[file]));
      if(changed.length) console.error(`${key}：内容/权限变化 ${changed.length} 项：${changed.slice(0,20).join(', ')}`);
      for(const field of ['head','status','index']) if(before[field]!==after[field]) console.error(`${key}：${field} 变化`);
    }
    throw new Error('来源或原服务基线发生变化，请人工核对；不会自动恢复');
  }
  console.log('ECC、插件目录及原服务基线一致');
}
