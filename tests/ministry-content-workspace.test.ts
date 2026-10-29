import test from 'node:test';import assert from 'node:assert/strict';
import type {Actor} from '../packages/ministry-core/src/directory';
import type {VerifiedSession} from '../apps/ministry/src/lib/cms-management-client';
import {manageGroups} from '../apps/ministry/src/lib/group-management';
import {manageSystemTools} from '../apps/ministry/src/lib/system-tools';
const actor:Actor={id:'operator',churchId:'test',role:'CONTENT',organizationIds:[],canDelete:true};
test('content operators retain scoped group news but cannot read membership, managers or system tools',async()=>{
 const original=globalThis.fetch,enabled=process.env.MINISTRY_OPERATIONAL_ENABLED;let calls=0;process.env.MINISTRY_OPERATIONAL_ENABLED='true';
 const session={client:{auth:{getSession:async()=>({data:{session:{user:{id:actor.id},access_token:'synthetic'}},error:null})}},user:{id:actor.id}} as unknown as VerifiedSession;
 globalThis.fetch=async()=>{calls++;return Response.json({groups:[],nextPage:null,superAdmin:true,enabled:true});};
 try{
  for(const view of ['MEMBERS','MANAGERS'])await assert.rejects(manageGroups(actor,{view,groupId:'test'},false,session),/담당자/);
  await assert.rejects(manageGroups(actor,{operation:'SAVE_GROUP',data:{id:'test',name:'Test',description:'',isActive:true}},true,session),/담당자/);
  await assert.rejects(manageSystemTools(actor,{kind:'ACTIVITY'},false,session),/권한/);assert.equal(calls,0);
  const value=await manageGroups(actor,{view:'GROUPS'},false,session);assert.ok('superAdmin'in value);assert.equal(value.superAdmin,false);assert.equal(calls,1);
 }finally{globalThis.fetch=original;if(enabled===undefined)delete process.env.MINISTRY_OPERATIONAL_ENABLED;else process.env.MINISTRY_OPERATIONAL_ENABLED=enabled;}
});
