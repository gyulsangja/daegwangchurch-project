import test from 'node:test';
import assert from 'node:assert/strict';
import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {createGroupAdminService} from '../packages/server/src/features/member/group-service';
import {createGroupManagement} from '../packages/server/src/features/church-content/group-management';
import {groupManagementCommand} from '../packages/contracts/src/group-management';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',c='33333333-3333-4333-8333-333333333333';
function fixture(){
 let state={members:[a,c],versions:{[a]:1,[b]:1,[c]:1} as Record<string,number>,logs:0};let confirmed=[a,b,c],deleting:string[]=[],role='SUPER_ADMIN',auditFails=false;const locks:string[][]=[];
 const admin=()=>({id:'admin',role,isActive:true});
 const db={adminProfile:{findUnique:async()=>admin()},groupManager:{findUnique:async()=>null},async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){const draft=structuredClone(state);const tx={
  adminProfile:{findFirst:async()=>admin(),findUnique:async()=>admin()},groupManager:{findUnique:async()=>null},
  churchGroup:{findFirst:async()=>({id:'group'})},$executeRaw:async(_sql:unknown,owners:string[])=>{assert.deepEqual(owners,[...owners].sort());locks.push(owners);return 0;},
  groupMembership:{findMany:async()=>draft.members.map(ownerId=>({ownerId})),createMany:async({data}:{data:{ownerId:string}[]})=>{draft.members.push(...data.map(r=>r.ownerId));},deleteMany:async({where}:{where:{ownerId:{in:string[]}}})=>{draft.members=draft.members.filter(id=>!where.ownerId.in.includes(id));}},
  churchMembership:{findMany:async()=>confirmed.map(ownerId=>({ownerId})),updateMany:async({where}:{where:{ownerId:{in:string[]}}})=>{for(const id of where.ownerId.in)draft.versions[id]++;}},
  memberDeletion:{findMany:async()=>deleting.map(ownerId=>({ownerId}))},activityLog:{create:async()=>{if(auditFails)throw Error('audit failure');draft.logs++;}},
 } as unknown as Prisma.TransactionClient;const result=await work(tx);state=draft;return result;}} as unknown as PrismaClient;
 return {service:createGroupAdminService(db,'admin'),management:createGroupManagement(db,true),read:()=>state,locks,confirm:(ids:string[])=>{confirmed=ids;},delete:(ids:string[])=>{deleting=ids;},role:(v:string)=>{role=v;},fail:()=>{auditFails=true;}};
}
test('bulk group changes preserve unseen members, bump church versions and lock owners in stable order once',async()=>{
 const f=fixture();await f.service.setMembershipBatch('group',[{ownerId:b,expectedMember:false,approved:true},{ownerId:a,expectedMember:true,approved:false}]);assert.deepEqual(f.read().members,[c,b]);assert.deepEqual(f.read().versions,{[a]:2,[b]:2,[c]:1});assert.deepEqual(f.locks,[[a,b]]);assert.equal(f.read().logs,1);
});
test('unapproved/deleting accounts, stale membership and audit failure roll back the entire batch',async()=>{
 const input=[{ownerId:a,expectedMember:true,approved:false},{ownerId:b,expectedMember:false,approved:true}];
 for(const configure of [(f:ReturnType<typeof fixture>)=>f.confirm([a,c]),(f:ReturnType<typeof fixture>)=>f.delete([b]),(f:ReturnType<typeof fixture>)=>f.fail()]){const f=fixture();configure(f);await assert.rejects(f.service.setMembershipBatch('group',input));assert.deepEqual(f.read().members,[a,c]);assert.equal(f.read().versions[a],1);assert.equal(f.read().logs,0);}
 const f=fixture();await assert.rejects(f.service.setMembershipBatch('group',[{ownerId:a,expectedMember:false,approved:true}]));assert.equal(f.read().logs,0);
});
test('legacy individual changes use the same church approval and version checks; group manager cannot bulk assign',async()=>{
 const f=fixture();f.confirm([a,c]);await assert.rejects(f.service.setMembership('group',b,true));await f.service.setMembership('group',a,false);assert.equal(f.read().versions[a],2);
 const g=fixture();g.role('ADMIN');await assert.rejects(g.service.setMembershipBatch('group',[{ownerId:b,expectedMember:false,approved:true}]),/FORBIDDEN/);assert.equal(g.locks.length,0);
 await assert.rejects(g.management.list('user',{view:'MEMBERS',groupId:'group'}),/권한/);await assert.rejects(g.management.list('user',{view:'NOTICE_DETAIL',groupId:'other',id:'notice'}),/담당 모임/);
});
test('publish, delete and assignments require explicit confirmation; duplicate member deltas rejected',()=>{
 const value={operation:'SAVE_NOTICE',id:'notice',version:null,data:{groupId:'group',title:'Test',body:'Test',audience:'MEMBERS',status:'PUBLISHED'}};assert.equal(groupManagementCommand.safeParse(value).success,false);assert.equal(groupManagementCommand.safeParse({...value,publishConfirmed:true}).success,true);
 const change={ownerId:a,expectedMember:true,approved:false};assert.equal(groupManagementCommand.safeParse({operation:'MEMBERS',groupId:'group',changes:[change,change],confirmed:true}).success,false);assert.equal(groupManagementCommand.safeParse({operation:'DELETE_NOTICE',groupId:'group',id:'notice',version:1}).success,false);
});
