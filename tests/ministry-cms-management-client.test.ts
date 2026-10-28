import test from 'node:test';
import assert from 'node:assert/strict';
import type {Actor} from '../packages/ministry-core/src/directory';
import {requestCmsManagement,type VerifiedSession} from '../apps/ministry/src/lib/cms-management-client';
const actor:Actor={id:'operator',churchId:'test',role:'ADMIN',organizationIds:[]};
test('verified request session is reused; fixed endpoint, empty fields and private response handling retained',async()=>{
 const original=globalThis.fetch;let sessions=0,calls=0;
 const session={client:{auth:{getSession:async()=>{sessions++;return {data:{session:{user:{id:actor.id},access_token:'test-token'}},error:null};}}},user:{id:actor.id}} as unknown as VerifiedSession;
 const raw={summary:'',status:'DRAFT'};
 globalThis.fetch=async(url,init)=>{calls++;assert.equal(url,'https://daegwangchurch-admin.vercel.app/api/manage/worship');assert.equal(init?.cache,'no-store');assert.equal(init?.redirect,'error');assert.deepEqual(JSON.parse(String(init?.body)),raw);return Response.json({saved:true});};
 try{assert.deepEqual(await requestCmsManagement(actor,'worship',{summary:undefined,status:'DRAFT'},true,session,raw),{saved:true});assert.equal(sessions,1);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('session identity mismatch never sends token; revocation response is not cached or accepted',async()=>{
 const original=globalThis.fetch;let calls=0;
 const session={client:{auth:{getSession:async()=>({data:{session:{user:{id:'operator'},access_token:'test-token'}},error:null})}},user:{id:'operator'}} as unknown as VerifiedSession;
 globalThis.fetch=async()=>{calls++;return Response.json({}, {status:403});};
 try{await assert.rejects(requestCmsManagement({...actor,id:'other'},'worship',{},false,session),/MINISTRY_LOGIN_REQUIRED/);assert.equal(calls,0);await assert.rejects(requestCmsManagement(actor,'worship',{},false,session),/권한/);assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
