import test from 'node:test';import assert from 'node:assert/strict';
import type {PrismaClient,Prisma,Media} from '@daegwang/database/generated/client';
import {verifyDocumentBytes} from '../packages/server/src/features/media/document-verification';
import {signDocumentReceipt,verifyDocumentReceipt} from '../packages/server/src/features/media/document-receipt';
import {createDocumentManagement} from '../packages/server/src/features/media/document-management';
const user='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222',key='synthetic-private-key-for-tests-only';
test('document receipts bind identity, extension, object, expiry and signature domain',()=>{
 const value={userId:user,mediaId:id,path:`documents/managed/${id}.pdf`,extension:'pdf' as const,size:20,expires:Date.now()+10000},token=signDocumentReceipt(value,key);
 assert.equal(verifyDocumentReceipt(token,user,key).path,value.path);
 for(const run of [()=>verifyDocumentReceipt(token,id,key),()=>verifyDocumentReceipt(token,user,key,Date.now()+20000),()=>verifyDocumentReceipt(token+'x',user,key),()=>signDocumentReceipt({...value,path:`documents/managed/${id}.txt`},key)])assert.throws(run);
 verifyDocumentBytes(Buffer.from('%PDF-1.7\nfile\n%%EOF'),'pdf');verifyDocumentBytes(Buffer.from('교회 안내'),'txt');
 for(const ext of ['pdf','docx','xlsx','pptx','hwp'] as const)assert.throws(()=>verifyDocumentBytes(Buffer.from('<script>invalid</script>'),ext));
 assert.throws(()=>verifyDocumentBytes(Buffer.from([0xff,0]),'txt'));
});
test('document reservations cannot be selected before validation, revoked uploads fail and failed audits roll back',async()=>{
 let row:Media|null=null,active=true,failAudit=false,verified=0;
 const db={async $transaction<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>){let draft=structuredClone(row);const tx={adminProfile:{findUnique:async()=>({id:'admin',isActive:active,role:'ADMIN'})},media:{create:async({data}:{data:Media})=>{draft={...data,width:null,height:null};return draft;},findFirst:async()=>draft,update:async({data}:{data:Partial<Media>})=>Object.assign(draft!,data)},activityLog:{create:async()=>{if(failAudit)throw Error('audit');}}} as unknown as Prisma.TransactionClient;const result=await fn(tx);row=draft;return result;}} as Pick<PrismaClient,'$transaction'>;
 const service=createDocumentManagement(db,{sign:async()=> 'https://example.test/signed',verifyDocument:async()=>{verified++;}},key,'https://example.test');
 const grant=await service(user,{operation:'PREPARE_DOCUMENT',name:'주간 안내.pdf',extension:'pdf',size:20});assert.ok('receipt'in grant);
 const current=()=>row as Media|null;assert.equal(current()?.visibility,'PRIVATE');
 active=false;await assert.rejects(service(user,{operation:'COMPLETE_DOCUMENT',receipt:grant.receipt}),/권한/);assert.equal(verified,0);
 active=true;failAudit=true;await assert.rejects(service(user,{operation:'COMPLETE_DOCUMENT',receipt:grant.receipt}),/audit/);assert.equal(current()?.visibility,'PRIVATE');
 failAudit=false;const complete=await service(user,{operation:'COMPLETE_DOCUMENT',receipt:grant.receipt});assert.ok('data'in complete);assert.equal(current()?.visibility,'PUBLIC');
});
