import test from 'node:test';
import assert from 'node:assert/strict';
import {createAccessPolicy} from '../../src/server/network.mjs';

const address={address:'0.0.0.0',port:3457};
const interfaces=['127.0.0.1','192.0.2.10','198.51.100.1'];
const request=(peer,host='192.0.2.10:3457',headers={})=>({socket:{remoteAddress:peer},headers:{host,...headers}});
test('LAN policy allows approved peers and actual local hosts, preserving Origin and port boundaries',()=>{
 const allow=createAccessPolicy(['192.0.2.0/24']);
 for(const peer of ['192.0.2.20','::ffff:192.0.2.20','127.0.0.1'])assert.equal(allow(request(peer),address,interfaces),true);
 assert.equal(allow(request('192.0.2.20',undefined,{origin:'http://192.0.2.10:3457'}),address,interfaces),true);
 for(const host of ['192.0.2.99:3457','198.51.100.1:3457','0.0.0.0:3457','192.0.2.10:3456','attacker.test:3457'])assert.equal(allow(request('192.0.2.20',host),address,interfaces),false);
 for(const origin of ['null','https://192.0.2.10:3457','http://attacker.test'])assert.equal(allow(request('192.0.2.20',undefined,{origin}),address,interfaces),false);
});
test('unapproved peers cannot use proxy headers to enter, and loopback-only remains the default',()=>{
 const allow=createAccessPolicy(['192.0.2.0/24']);
 assert.equal(allow(request('198.51.100.20',undefined,{'x-forwarded-for':'192.0.2.20',forwarded:'for=127.0.0.1'}),address,interfaces),false);
 assert.equal(allow(request('192.0.3.20'),address,interfaces),false);
 const local=createAccessPolicy();
 assert.equal(local(request('127.0.0.1','localhost:3457'),address,interfaces),true);
 assert.equal(local(request('192.0.2.20','localhost:3457'),address,interfaces),false);
});
test('malformed ranges are rejected before serving',()=>{
 for(const value of [['0.0.0.0/0'],['192.0.2.1/33'],['192.0.2.1/-1'],['192.0.2.1/24/extra'],['999.0.0.1/24'],['192.0.2.0'],['::/64'],'192.0.2.0/24'])assert.throws(()=>createAccessPolicy(value),/INVALID_ALLOWED_CIDRS/);
});
