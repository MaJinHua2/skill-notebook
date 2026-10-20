import {isIPv4} from 'node:net';
import {networkInterfaces} from 'node:os';

const ipv4Number=address=>address.split('.').reduce((value,part)=>(value*256+Number(part))>>>0,0);
const loopback=address=>address==='::1'||(isIPv4(address)&&address.startsWith('127.'));
const interfaceAddresses=()=>Object.values(networkInterfaces()).flat().filter(Boolean).map(info=>info.address);

export function createAccessPolicy(allowedCidrs=[]){
 if(!Array.isArray(allowedCidrs))throw new Error('INVALID_ALLOWED_CIDRS');
 const ranges=allowedCidrs.map(cidr=>{
  if(typeof cidr!=='string')throw new Error('INVALID_ALLOWED_CIDRS');
  const parts=cidr.split('/');
  if(parts.length!==2||!isIPv4(parts[0])||!/^([1-9]|[12]\d|3[0-2])$/.test(parts[1]))throw new Error('INVALID_ALLOWED_CIDRS');
  const mask=(0xffffffff<<(32-Number(parts[1])))>>>0;
  return {mask,network:(ipv4Number(parts[0])&mask)>>>0};
 });
 const inRange=address=>isIPv4(address)&&ranges.some(({mask,network})=>((ipv4Number(address)&mask)>>>0)===network);
 return (req,address,localAddresses=interfaceAddresses())=>{
  const peer=(req.socket.remoteAddress||'').replace(/^::ffff:/,'');
  if(!loopback(peer)&&!inRange(peer))return false;
  const hosts=new Set([`127.0.0.1:${address.port}`,`localhost:${address.port}`]);
  if(address.address==='::1')hosts.add(`[::1]:${address.port}`);
  for(const ip of localAddresses)if(inRange(ip))hosts.add(`${ip}:${address.port}`);
  return hosts.has(req.headers.host)&&(!req.headers.origin||req.headers.origin===`http://${req.headers.host}`);
 };
}
