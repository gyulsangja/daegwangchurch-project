import test from 'node:test';
import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createIntakeManagement} from '../packages/server/src/features/church-content/intake-management';
function fixture(){
 const date=new Date('2026-10-29T00:00:00Z');let active=true,role='SUPER_ADMIN',designated=true,auditFails=false;
 let inquiry={id:'inquiry1',type:'GENERAL',status:'NEW',name:'Fixture',title:'Question',phone:'01000000000',email:null,preferredContact:null,content:'Private inquiry',createdAt:date,updatedAt:date,deletedAt:null,checkedAt:null as Date|null,completedAt:null as Date|null};
 let care={id:'care1',status:'RECEIVED',version:1,createdAt:date,updatedAt:date,expiresAt:new Date('2027-01-01'),content:{kind:'COUNSELING',name:'Fixture',phone:'01000000000',preferredTime:'',message:'Private care',method:'DISCUSS'}};
 let logs:unknown[]=[];let notes:unknown[]=[];
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){let i=structuredClone(inquiry),c=structuredClone(care);const l=[...logs],n=[...notes];
  const result=await work({adminProfile:{findUnique:async()=>({id:'admin1',role,isActive:active})},careSetting:{findUnique:async()=>({policy:{version:'v1',notice:'Fixture policy',retentionDays:90,adminIds:[designated?'admin1':'other']}})},inquiry:{findMany:async({select,take}:{select:Record<string,unknown>;take:number})=>{assert.equal(select.content,undefined);assert.equal(select.phone,undefined);assert.equal(take,31);return [i];},findFirst:async()=>i,updateMany:async({where,data}:{where:{updatedAt:Date};data:object})=>{if(where.updatedAt.getTime()!==i.updatedAt.getTime())return {count:0};i={...i,...data,updatedAt:new Date('2026-10-29T01:00:00Z')};return {count:1};}},inquiryNote:{create:async(x:unknown)=>{n.push(x);}},memberCareRequest:{findMany:async({where,take}:{where:{expiresAt:{gt:Date}};take:number})=>{assert.equal(take,31);return c.expiresAt>where.expiresAt.gt?[c]:[];},findFirst:async({where}:{where:{expiresAt:{gt:Date}}})=>c.expiresAt>where.expiresAt.gt?c:null,updateMany:async({where,data}:{where:{version:number;status:string};data:{status:string}})=>{if(c.version!==where.version||c.status!==where.status)return {count:0};c={...c,status:data.status,version:c.version+1};return {count:1};}},activityLog:{create:async(x:unknown)=>{if(auditFails)throw Error('AUDIT_FAILED');l.push(x);}}} as unknown as Prisma.TransactionClient);
  inquiry=i;care=c;logs=l;notes=n;return result;
 }} as unknown as Pick<PrismaClient,'$transaction'>;
 return {service:createIntakeManagement(db,()=>date),read:()=>({inquiry,care,logs,notes}),revoke:()=>{active=false;},noDesignation:()=>{designated=false;},normalAdmin:()=>{role='ADMIN';},expire:()=>{care.expiresAt=new Date('2026-01-01');},failAudit:()=>{auditFails=true;}};
}
test('intake lists redact contacts and messages; CMS role and current care designation are enforced',async()=>{
 const f=fixture();const list=await f.service.list('user',{kind:'CARE'});assert.ok('data'in list&&Array.isArray(list.data));assert.equal('content'in list.data[0],false);assert.equal('phone'in list.data[0],false);
 f.normalAdmin();await assert.rejects(f.service.list('user',{kind:'INQUIRY'}),/권한/);await f.service.list('user',{kind:'CARE'});
 f.noDesignation();await assert.rejects(f.service.list('user',{kind:'CARE',id:'care1'}),/담당자/);
 f.revoke();await assert.rejects(f.service.list('user',{kind:'CARE'}),/권한/);
});
test('care state changes use source version and transitions; expired requests are inaccessible',async()=>{
 const f=fixture();await f.service.save('user',{kind:'CARE',id:'care1',version:1,status:'DISCUSSING'});assert.equal(f.read().care.version,2);
 await assert.rejects(f.service.save('user',{kind:'CARE',id:'care1',version:1,status:'SCHEDULED'}),/변경/);
 await f.service.save('user',{kind:'CARE',id:'care1',version:2,status:'COMPLETED'});
 await assert.rejects(f.service.save('user',{kind:'CARE',id:'care1',version:3,status:'DISCUSSING'}),/변경/);
 f.expire();await assert.rejects(f.service.list('user',{kind:'CARE',id:'care1'}),/보관 기간/);
});
test('inquiry status and note are atomic with audit, and reject stale versions',async()=>{
 const input={kind:'INQUIRY',id:'inquiry1',expectedUpdatedAt:'2026-10-29T00:00:00.000Z',status:'CONTACTING',note:'Internal note'};
 const f=fixture();await f.service.save('user',input);assert.equal(f.read().inquiry.status,'CONTACTING');assert.equal(f.read().notes.length,1);assert.equal(JSON.stringify(f.read().logs).includes('Internal note'),false);
 await assert.rejects(f.service.save('user',input),/변경/);assert.equal(f.read().notes.length,1);
 const g=fixture();g.failAudit();await assert.rejects(g.service.save('user',input),/AUDIT_FAILED/);assert.equal(g.read().inquiry.status,'NEW');assert.equal(g.read().notes.length,0);
});
