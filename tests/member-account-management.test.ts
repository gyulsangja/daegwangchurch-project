import test from 'node:test';
import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createMemberAccountManagement} from '../packages/server/src/features/church-content/member-account-management';
const user='11111111-1111-4111-8111-111111111111';const target='22222222-2222-4222-8222-222222222222';
function fixture(role='SUPER_ADMIN',unifiedAccess=false){
 let queries=0,groups=0,memberships=0,reviews=0;
 const actor={id:'admin',authUserId:user,role,isActive:true};
 const tx={adminProfile:{findUnique:async()=>actor,findFirst:async()=>actor},$queryRaw:async(query:{text:string})=>{queries++;assert.doesNotMatch(query.text,/encrypted_password|refresh_token|SELECT\s+\*/i);if(query.text.includes('count(*)'))return [{total:1n}];return [{id:target,email:'fixture@example.invalid',name:'Fixture',createdAt:new Date('2026-10-29'),lastSignInAt:null,status:'PENDING',phone:'01000000000',position:'성도',version:1,adminId:null,role:null,activeAdmin:null,deletionStatus:null}];},$executeRaw:async()=>0,churchGroup:{findMany:async()=>{groups++;return [{id:'group',name:'Fixture group'}];},count:async()=>0},groupMembership:{findMany:async()=>{memberships++;return [];},deleteMany:async()=>({count:0})},memberDeletion:{findUnique:async()=>null},churchMembership:{findUnique:async()=>({realName:'Fixture',phone:'01000000000',position:'성도'}),updateMany:async()=>{reviews++;return {count:1};}},activityLog:{create:async()=>({})}};
 const db={...tx,$transaction:async<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>)=>work(tx as unknown as Prisma.TransactionClient)} as unknown as PrismaClient;
 return {service:createMemberAccountManagement(db,{membershipEnabled:true,unifiedAccess}),read:()=>({queries,groups,memberships,reviews})};
}
test('account management verifies CMS super-admin before reading identity directory and batches groups',async()=>{
 const denied=fixture('ADMIN');await assert.rejects(denied.service.list(user,{}),/최고관리자/);assert.equal(denied.read().queries,0);
 const f=fixture();const page=await f.service.list(user,{});assert.equal(page.rows[0].createdAt,'2026-10-29T00:00:00.000Z');assert.equal(page.actorId,user);assert.deepEqual(f.read(),{queries:2,groups:1,memberships:1,reviews:0});
});
test('unified access rejects legacy role changes even for CMS super-admin',async()=>{
 const f=fixture('SUPER_ADMIN',true);
 await assert.rejects(f.service.save(user,{operation:'ROLE',ownerId:target,role:'ADMIN',confirmed:true}),/사용자 및 권한/);
 assert.equal(f.read().reviews,0);
});
test('church approval uses the existing strict review contract and rejects unconfirmed role/deletion requests',async()=>{
 const f=fixture();await f.service.save(user,{operation:'REVIEW',ownerId:target,version:1,status:'CONFIRMED',groupIds:[]});assert.equal(f.read().reviews,1);
 await assert.rejects(f.service.save(user,{operation:'ROLE',ownerId:target,role:'SUPER_ADMIN'}));
 await assert.rejects(f.service.save(user,{operation:'DELETE',ownerId:target,email:'fixture@example.invalid',confirm:'no'}));
});
