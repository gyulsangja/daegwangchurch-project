import test from 'node:test';
import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createWorshipManagement} from '../packages/server/src/features/church-content/worship-management';

function fixture(){
 let row={id:'bulletin1',pdfMediaId:'current-file',title:'Keep title',status:'PUBLISHED',updatedAt:new Date('2026-10-29T00:00:00Z')};
 let failAudit=false;let savedHistory=0;
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){
  let pending={...row};let history=0;
  const result=await work({
   adminProfile:{findUnique:async()=>({id:'admin1',role:'ADMIN',isActive:true})},
   bulletin:{findFirst:async()=>pending,updateMany:async({data}:{data:{pdfMediaId:string}})=>{pending={...pending,...data,updatedAt:new Date('2026-10-29T01:00:00Z')};return {count:1};}},
   bulletinFileVersion:{findFirst:async({where}:{where:{id:string;bulletinId:string;media:unknown}})=>{
    assert.equal(where.bulletinId,'bulletin1');assert.deepEqual(where.media,{deletedAt:null,visibility:'PUBLIC',mimeType:'application/pdf'});
    return where.id==='own-version'?{mediaId:'previous-file'}:null;
   },upsert:async()=>{history++;}},
   activityLog:{create:async()=>{if(failAudit)throw Error('audit failed');}},
  } as unknown as Prisma.TransactionClient);
  row=pending;savedHistory+=history;return result;
 }} as unknown as Pick<PrismaClient,'$transaction'>;
 return {service:createWorshipManagement(db),read:()=>({row,savedHistory}),failAudit:()=>{failAudit=true;}};
}
const input={operation:'RESTORE_FILE',id:'bulletin1',versionId:'own-version',expectedUpdatedAt:'2026-10-29T00:00:00.000Z',publishConfirmed:true};
test('file restore requires public confirmation and own valid version; preserves content and remembers displaced file',async()=>{
 const f=fixture();
 await assert.rejects(f.service.save('admin',{...input,publishConfirmed:false}),/확인/);
 await assert.rejects(f.service.save('admin',{...input,versionId:'other-bulletin-version'}),/찾을 수/);
 assert.equal(f.read().row.pdfMediaId,'current-file');
 await f.service.save('admin',input);
 assert.equal(f.read().row.pdfMediaId,'previous-file');assert.equal(f.read().row.title,'Keep title');assert.equal(f.read().row.status,'PUBLISHED');assert.equal(f.read().savedHistory,1);
 await assert.rejects(f.service.save('admin',input),/다른 화면/);
});
test('file restore and history roll back together if audit write fails',async()=>{
 const f=fixture();f.failAudit();await assert.rejects(f.service.save('admin',input),/audit failed/);
 assert.equal(f.read().row.pdfMediaId,'current-file');assert.equal(f.read().savedHistory,0);
});
