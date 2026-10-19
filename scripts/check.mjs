import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const deleted = new Set(execFileSync('git', ['ls-files', '--deleted', '-z']).toString().split('\0').filter(Boolean));
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).toString().split('\0').filter(Boolean))].filter(file => !deleted.has(file));
for (const file of files) {
  if (file.endsWith('.mjs')) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  if (file.endsWith('.json')) JSON.parse(await readFile(file, 'utf8'));
}
const noteFiles = files.filter(file => /^data\/learning-notes\/.*\.json$/.test(file));
const seen = new Set();
let count = 0;
for (const file of noteFiles) {
  const notes = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(notes)) throw new Error(`笔记必须为数组：${file}`);
  for (const note of notes) {
    if (seen.has(note.id)) throw new Error(`重复笔记：${note.id}`);
    seen.add(note.id);
    if (!/^ecc\/(native|migrated)\/[a-z0-9-]+$/.test(note.id)) throw new Error('公开笔记仅接受 ECC 来源');
    if (note.callName !== `ecc:${note.id.split('/')[2]}`) throw new Error(`调用名不匹配：${note.id}`);
    for (const key of ['nameZh', 'summaryZh', 'category']) {
      if (typeof note[key] !== 'string' || !/[\u3400-\u9fff]/.test(note[key]) || /待整理|待核实|TODO/.test(note[key])) throw new Error(`中文字段无效：${note.id}/${key}`);
    }
    for (const key of ['scenariosZh', 'tags']) {
      if (!Array.isArray(note[key]) || !note[key].length || note[key].some(x => typeof x !== 'string' || !x.trim())) throw new Error(`数组字段无效：${note.id}/${key}`);
    }
    if (!/^[a-f0-9]{64}$/.test(note.sourceHash) || typeof note.version !== 'string') throw new Error(`来源校验信息无效：${note.id}`);
    count++;
  }
}
for (const file of files.filter(file => /\.(?:mjs|md|json|html|css)$/.test(file) && file !== 'package-lock.json')) {
  const text = await readFile(file, 'utf8');
  if (/\/home\/[a-z][\w-]*\//i.test(text) || /(?:ghp_|github_pat_)[a-zA-Z0-9_]{15,}/.test(text)) throw new Error(`公开范围发现本机路径或凭据：${file}`);
}
console.log(`语法、JSON、公开范围和中文笔记契约通过；公开笔记 ${count} 项`);
