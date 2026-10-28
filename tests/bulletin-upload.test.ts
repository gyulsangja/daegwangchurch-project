import test from 'node:test';
import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createBulletinUploadManagement} from '../packages/server/src/features/bulletins/upload-management';
import {signUploadReceipt,verifyUploadReceipt} from '../packages/server/src/features/bulletins/upload-receipt';
const user='11111111-1111-4111-8111-111111111111';const key='test-signing-key-only-for-isolated-tests';
test('upload proof binds uploader, object, size and expiry and rejects tampering',()=>{
 const proof=signUploadReceipt({userId:user,mediaId:user,path:`bulletins/managed/${user}.pdf`,size:20,expires:2000},key);
 assert.equal(verifyUploadReceipt(proof,user,key,1000).size,20);
 assert.throws(()=>verifyUploadReceipt(proof,user,key,2000));assert.throws(()=>verifyUploadReceipt(proof,'22222222-2222-4222-8222-222222222222',key,1000));
 const [payload,signature]=proof.split('.');const changed=JSON.parse(Buffer.from(payload,'base64url').toString());changed.size=1;
 assert.throws(()=>verifyUploadReceipt(Buffer.from(JSON.stringify(changed)).toString('base64url')+'.'+signature,user,key,1000));
});
function fixture(){
 type Row=Record<string,unknown>;let media:Row[]=[];let bulletin:Row|null=null;let history:Row[]=[];let logs:unknown[]=[];let active=true;let failAudit=false;let failFile=false;let signs=0;
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){let pending=bulletin?structuredClone(bulletin):null;const files=structuredClone(media),versions=structuredClone(history),audit=structuredClone(logs);
  const result=await work({adminProfile:{findUnique:async()=>({id:'admin',role:'ADMIN',isActive:active})},media:{create:async({data}:{data:Row})=>{files.push(data);return data;},findFirst:async({where}:{where:Row})=>files.find(f=>f.id===where.id&&f.objectPath===where.objectPath)},bulletin:{findFirst:async()=>pending,create:async({data}:{data:Row})=>{pending={...data,updatedAt:new Date('2026-10-29T00:00:00Z'),deletedAt:null};return pending;},findUniqueOrThrow:async()=>pending,updateMany:async({data}:{data:Row})=>{pending={...pending,...data,updatedAt:new Date('2026-10-29T01:00:00Z')};return {count:1};}},bulletinFileVersion:{upsert:async({create}:{create:Row})=>{versions.push(create);}},activityLog:{create:async(data:unknown)=>{if(failAudit)throw Error('AUDIT_FAILED');audit.push(data);}}} as unknown as Prisma.TransactionClient);
  bulletin=pending;media=files;history=versions;logs=audit;return result;
 }} as unknown as Pick<PrismaClient,'$transaction'>;
 const service=createBulletinUploadManagement(db,{sign:async()=>{signs++;return 'https://example.invalid/signed';},verify:async()=>{if(failFile)throw Error('INVALID_PDF');}},key);
 return {service,read:()=>({bulletin,media,history,logs,signs}),revoke:()=>{active=false;},failAudit:()=>{failAudit=true;},failFile:()=>{failFile=true;}};
}
const data={operation:'SAVE_PDF',id:'bulletin1',expectedUpdatedAt:null,title:'주보',worshipDate:'2026-10-25',summary:'',status:'PUBLISHED',publishConfirmed:true};
async function prepare(f:ReturnType<typeof fixture>){return (await f.service(user,{operation:'PREPARE_PDF',name:'주보.pdf',size:20}) as {receipt:string}).receipt;}
test('direct PDF registration preserves old file, original ID and slug on replacement; stale saves rejected',async()=>{
 const f=fixture();const receipt=await prepare(f);await f.service(user,{...data,receipt});const before=f.read().bulletin!;
 await assert.rejects(f.service(user,{...data,receipt}),/이미 저장/);
 const next=await prepare(f);await f.service(user,{...data,receipt:next,expectedUpdatedAt:(before.updatedAt as Date).toISOString()});
 const after=f.read().bulletin!;assert.equal(after.id,before.id);assert.equal(after.slug,before.slug);assert.notEqual(after.pdfMediaId,before.pdfMediaId);
 assert.ok(f.read().history.some(v=>v.mediaId===before.pdfMediaId));assert.equal(f.read().media.length,2);assert.equal(f.read().logs.length,2);
 await assert.rejects(f.service(user,{...data,receipt:next,expectedUpdatedAt:(before.updatedAt as Date).toISOString()}),/다른 화면/);
});
test('revocation, invalid file and audit failure cannot publish a bulletin',async()=>{
 const f=fixture();const receipt=await prepare(f);f.revoke();await assert.rejects(f.service(user,{...data,receipt}),/권한/);await assert.rejects(prepare(f),/권한/);assert.equal(f.read().signs,1);
 const g=fixture();const bad=await prepare(g);g.failFile();await assert.rejects(g.service(user,{...data,receipt:bad}),/INVALID_PDF/);assert.equal(g.read().bulletin,null);
 const h=fixture();const valid=await prepare(h);h.failAudit();await assert.rejects(h.service(user,{...data,receipt:valid}),/AUDIT_FAILED/);assert.equal(h.read().bulletin,null);assert.equal(h.read().history.length,0);
});
