import {GUIDES} from '../web/guides-config.mjs';
import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['web/app.mjs'], bundle: true, format: 'esm', target: ['chrome110', 'edge110'], outfile: 'dist/app.js', minify: true });
await copyFile('web/index.html', 'dist/index.html');
for (const guide of GUIDES) {
  const directory=`guides/${guide.id}`;
  await mkdir(`dist/${directory}`, { recursive: true });
  for (const name of guide.files) await copyFile(`web/${directory}/${name}`, `dist/${directory}/${name}`);
}
console.log('已构建独立前端：dist/');
