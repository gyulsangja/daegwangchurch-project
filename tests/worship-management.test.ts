import test from 'node:test';
import assert from 'node:assert/strict';
import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {createWorshipManagement} from '../packages/server/src/features/church-content/worship-management';
import {bulletinManagementSave,worshipMonthRange,worshipManagementBundle} from '../packages/contracts/src/worship-management';
function fixture(){
 let row={id:'bulletin1',title:'Test',slug:'keep-slug',worshipDate:new Date('2026-10-25'),summary:null as string|null,status:'DRAFT',updatedAt:new Date('2026-10-29T00:00:00Z'),deletedAt:null,pdfMediaId:'keep-file',worshipContentId:null as string|null,publishedAt:null as Date|null};
 let logs:unknown[]=[];let active=true;let auditFails=false;let conflict=false;
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){let pending=structuredClone(row);const pendingLogs=structuredClone(logs);
  const tx={adminProfile:{findUnique:async({where}:{where:{authUserId:string}})=>where.authUserId==='admin'?{id:'admin1',role:'ADMIN',isActive:active}:null},bulletin:{findFirst:async()=>pending,findMany:async(args:{where:{deletedAt:null;worshipDate:{gte:Date;lt:Date}};take:number;select:Record<string,unknown>})=>{assert.equal(args.where.deletedAt,null);assert.equal(args.take,31);assert.equal(args.select.pdfMedia,undefined);return [{...pending,worshipContent:null}];},updateMany:async({where,data}:{where:{updatedAt:Date;deletedAt:null};data:object})=>{assert.equal(where.deletedAt,null);if(conflict||where.updatedAt.getTime()!==pending.updatedAt.getTime())return {count:0};pending={...pending,...data,updatedAt:new Date(pending.updatedAt.getTime()+1)};return {count:1};}},worshipContent:{findFirst:async({where}:{where:{id:string;deletedAt:null}})=>where.id==='worship1'&&where.deletedAt===null?{id:'worship1'}:null},activityLog:{create:async(data:unknown)=>{if(auditFails)throw Error('audit failure');pendingLogs.push(data);}}} as unknown as Prisma.TransactionClient;
  const result=await work(tx);row=pending;logs=pendingLogs;return result;
 }} as unknown as Pick<PrismaClient,'$transaction'>;
 return {service:createWorshipManagement(db),read:()=>({row,logs}),revoke:()=>{active=false;},failAudit:()=>{auditFails=true;},race:()=>{conflict=true;}};
}
function input(version='2026-10-29T00:00:00.000Z'){return {id:'bulletin1',expectedUpdatedAt:version,title:'Changed',worshipDate:'2026-10-25',summary:'Public summary',status:'DRAFT',worshipContentId:'worship1'};}
test('bulletin source edit preserves IDs, files and URL; authorization and stale writes enforced',async()=>{
 const f=fixture();await assert.rejects(f.service.list('visitor',{month:'2026-10'}),/권한/);await assert.rejects(f.service.save('visitor',input()),/권한/);
 const page=await f.service.list('admin',{month:'2026-10'});assert.ok('data'in page);assert.equal(page.data[0].date,'2026-10-25');assert.equal('pdfMediaId'in page.data[0],false);
 await f.service.save('admin',input());assert.equal(f.read().row.worshipContentId,'worship1');assert.equal(f.read().row.slug,'keep-slug');assert.equal(f.read().row.pdfMediaId,'keep-file');
 await assert.rejects(f.service.save('admin',input()),/다른 화면/);f.revoke();await assert.rejects(f.service.list('admin',{month:'2026-10'}),/권한/);
});
test('invalid/deleted links, concurrent changes and audit failures leave original unchanged',async()=>{
 const f=fixture();await assert.rejects(f.service.save('admin',{...input(),worshipContentId:'missing'}),/연결할 말씀/);assert.equal(f.read().logs.length,0);
 f.race();await assert.rejects(f.service.save('admin',input()),/다른 화면/);assert.equal(f.read().row.title,'Test');
 const g=fixture();g.failAudit();await assert.rejects(g.service.save('admin',input()),/audit/);assert.equal(g.read().row.title,'Test');
});
test('publishing needs confirmation; date filters cover December rollover and reject malformed months',()=>{
 assert.equal(bulletinManagementSave.safeParse({...input(),status:'PUBLISHED'}).success,false);assert.equal(bulletinManagementSave.safeParse({...input(),status:'PUBLISHED',publishConfirmed:true}).success,true);
 assert.equal(worshipMonthRange('2026-12').lt.toISOString(),'2027-01-01T00:00:00.000Z');assert.throws(()=>worshipMonthRange('2026-13'));assert.throws(()=>worshipMonthRange('2026-01-other'));
});
test('combined list authorizes once and reads each bounded collection once',async()=>{
 let auth=0,bulletins=0,worship=0,transactions=0;
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){transactions++;return work({adminProfile:{findUnique:async()=>{auth++;return {id:'admin',role:'ADMIN',isActive:true};}},bulletin:{findMany:async({skip,take}:{skip:number;take:number})=>{assert.equal(skip,30);assert.equal(take,31);bulletins++;return [];}},worshipContent:{findMany:async({skip,take}:{skip:number;take:number})=>{assert.equal(skip,60);assert.equal(take,31);worship++;return [];}}} as unknown as Prisma.TransactionClient);}} as unknown as Pick<PrismaClient,'$transaction'>;
 const value=await createWorshipManagement(db).list('admin',{month:'2026-10',kind:'ALL',bulletinPage:1,worshipPage:2});
 assert.deepEqual(worshipManagementBundle.parse(value),{BULLETIN:{data:[],nextPage:null},WORSHIP:{data:[],nextPage:null}});assert.deepEqual({auth,bulletins,worship,transactions},{auth:1,bulletins:1,worship:1,transactions:1});
});
