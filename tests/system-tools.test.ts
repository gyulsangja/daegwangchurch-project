import test from 'node:test';import assert from 'node:assert/strict';
import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {createSystemTools} from '../packages/server/src/features/church-content/system-tools';
test('system tools require current super-admin and file candidates retain every reference protection',async()=>{
 let active=true,reads=0,where:Record<string,unknown>|undefined;
 const tx={adminProfile:{findUnique:async()=>({id:'admin',isActive:active,role:'SUPER_ADMIN'})},media:{findMany:async(input:{where:Record<string,unknown>})=>{reads++;where=input.where;return [];}},activityLog:{findMany:async()=>{reads++;return [];}}};
 const db={...tx,$transaction:async<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>)=>work(tx as unknown as Prisma.TransactionClient)} as unknown as PrismaClient;
 const service=createSystemTools(db,async()=>{throw Error('No storage mutation expected');});
 await service.list('user',{kind:'FILES'});assert.equal(where?.bucket,'public-assets');
 for(const key of ['bulletinFileVersions','noticeAttachments','albumImages','inquiryAttachments','people','ministries'])assert.deepEqual(where?.[key],{none:{}});
 active=false;await assert.rejects(service.list('user',{kind:'ACTIVITY'}),/권한/);await assert.rejects(service.save('user',{operation:'CLEANUP',ids:['file'],confirmed:true}),/권한/);assert.equal(reads,1);
});
