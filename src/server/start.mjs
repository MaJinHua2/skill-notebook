import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.mjs';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const configFile=path.resolve(process.env.SKILL_READER_CONFIG || path.join(projectRoot,'.local/sources.json'));
const port=Number(process.env.SKILL_READER_PORT || 3457);
const host=process.env.SKILL_READER_HOST||'127.0.0.1';
const allowedCidrs=(process.env.SKILL_READER_ALLOWED_CIDRS||'').split(',').map(value=>value.trim()).filter(Boolean);
try {
  if(!Number.isInteger(port) || port<1 || port>65535) throw new Error('INVALID_PORT');
  if(!['127.0.0.1','0.0.0.0'].includes(host)||(host==='0.0.0.0'&&!allowedCidrs.length))throw new Error('INVALID_NETWORK_CONFIG');
  const config=JSON.parse(await readFile(configFile,'utf8'));
  const server=await createApp({config,notesFiles:[path.join(projectRoot,'data/learning-notes/ecc.json')],webRoot:path.join(projectRoot,'dist'),allowedCidrs});
  server.on('error',error=> {
    console.error(error.code==='EADDRINUSE'?'阅读器端口已被占用，请选择独立端口。':'阅读器无法启动，请检查本地配置。'); process.exitCode=1;
  });
  server.listen(port,host,()=>console.log(`技能阅读器：http://${host}:${port}/`));
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
} catch {
  console.error('阅读器配置无效或不可用。请检查本地来源配置与端口。'); process.exitCode=1;
}
