import test from 'node:test';
import assert from 'node:assert/strict';
import {logoutResponse} from '../apps/ministry/src/lib/logout-response';
test('logout expires ministry cookies including chunks but preserves other app cookies',()=>{
 const r=logoutResponse('http://localhost:3002',['ministry-auth.0','ministry-auth.1','ministry-auth-code-verifier.0','sb-other-auth-token','ministry-auth-unrelated']);
 assert.equal(r.status,303);assert.equal(r.headers.get('location'),'http://localhost:3002/login');
 const cookies=r.cookies.getAll();for(const name of ['ministry-auth','ministry-auth.0','ministry-auth.1','ministry-auth-code-verifier','ministry-auth-code-verifier.0']){const c=cookies.find(c=>c.name===name);assert.ok(c);assert.equal(c.value,'');assert.equal(c.maxAge,0);assert.equal(c.path,'/');assert.equal(c.httpOnly,true);}
 assert.ok(!cookies.some(c=>c.name==='sb-other-auth-token'||c.name==='ministry-auth-unrelated'));
 assert.equal(logoutResponse('https://church.example',[]).cookies.get('ministry-auth')?.secure,true);
});
