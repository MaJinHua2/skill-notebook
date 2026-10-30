import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({ entryPoints: ['web/app.mjs'], bundle: true, format: 'esm', target: ['chrome110', 'edge110'], outfile: 'dist/app.js', minify: true });
await copyFile('web/index.html', 'dist/index.html');
await mkdir('dist/guides/multi-agent-development', { recursive: true });
for (const name of ['index.html', 'guide.css', 'guide.js']) {
  await copyFile(`web/guides/multi-agent-development/${name}`, `dist/guides/multi-agent-development/${name}`);
}
console.log('已构建独立前端：dist/');
