import test from 'node:test';import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {saveCareSettings} from '../packages/server/src/features/member/care-settings';
import {createOperationsSettings} from '../packages/server/src/features/church-content/operations-settings';
import {careSettingsInput} from '../packages/contracts/src/operations-settings';
test('care policy edits require current version, active recipients and atomic audit without touching requests',async()=>{
 type Row={enabled:boolean;policy:{version:string;notice:string;retentionDays:number;adminIds:string[]}};let row:Row|null=null,active=true,failAudit=false;let count=1;const locks:string[]=[];
 const db={adminProfile:{findUnique:async()=>({id:'admin',role:active?'SUPER_ADMIN':'ADMIN',isActive:true})},async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){let draft=structuredClone(row);const result=await work({$executeRaw:async(strings:TemplateStringsArray)=>{locks.push(strings.join(''));},adminProfile:{findFirst:async()=>active?{id:'admin'}:null,count:async()=>count},careSetting:{findUnique:async()=>draft,upsert:async({create}:{create:Row})=>{draft=create;}},activityLog:{create:async()=>{if(failAudit)throw Error('AUDIT_FAILED');}}} as unknown as Prisma.TransactionClient);row=draft;return result;}} as unknown as PrismaClient;
 const input={enabled:true,policy:{version:'first',notice:'동의 안내',retentionDays:1825,adminIds:['admin']}};
 await saveCareSettings(db,'admin',input,null);await assert.rejects(saveCareSettings(db,'admin',{...input,enabled:false},null),/다른 화면/);
 failAudit=true;await assert.rejects(saveCareSettings(db,'admin',{...input,enabled:false},'first'),/AUDIT/);assert.equal((row as Row|null)?.enabled,true);failAudit=false;count=0;await assert.rejects(saveCareSettings(db,'admin',input,'first'),/INVALID_ADMIN/);
 active=false;await assert.rejects(createOperationsSettings(db).list('user'),/권한/);assert.ok(locks.some(l=>l.includes('admin-member-management')));
 assert.equal(careSettingsInput.safeParse({expectedVersion:null,enabled:true,adminIds:['admin'],retentionUnit:'years',retention:11,notice:'Notice',confirmed:true}).success,false);
});
