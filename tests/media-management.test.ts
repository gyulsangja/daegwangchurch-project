import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createMediaManagement,selectableMedia} from '../packages/server/src/features/media/management';
import {verifyImageBytes} from '../packages/server/src/features/media/image-verification';
import {signImageReceipt,verifyImageReceipt} from '../packages/server/src/features/media/upload-receipt';
import {signUploadReceipt} from '../packages/server/src/features/bulletins/upload-receipt';
import {cleanupMedia} from '../packages/server/src/features/media/cleanup';
const user='11111111-1111-4111-8111-111111111111',key='isolated-test-signing-key-not-a-secret';
test('cleanup never removes storage before DB commit and retains failed removals for retry',async()=>{
 let committed=false;const removed:string[]=[],restored:Record<string,unknown>[]=[];
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){const result=await work({media:{findMany:async()=>[{id:'linked-during-review',bucket:'public-assets',objectPath:'keep.png',sizeBytes:10},{id:'unused',bucket:'public-assets',objectPath:'retry.png',sizeBytes:10}],deleteMany:async({where}:{where:{AND:unknown[]}})=>({count:JSON.stringify(where).includes('unused')?1:0}),create:async({data}:{data:Record<string,unknown>})=>{restored.push(data);}},activityLog:{create:async()=>{}}} as unknown as Prisma.TransactionClient);committed=true;return result;}} as unknown as Pick<PrismaClient,'$transaction'>;
 const result=await cleanupMedia(db,{},'admin',async(_bucket,paths)=>{assert.equal(committed,true);removed.push(...paths);throw Error('STORAGE_OFFLINE');});
 assert.deepEqual(removed,['retry.png']);assert.equal(restored.length,1);assert.ok(restored[0].deletedAt instanceof Date);assert.equal(restored[0].id,'unused');assert.deepEqual(result,{count:0,storageFailures:1});
 let called=false;const broken={async $transaction(){throw Error('DB_CONFLICT');}} as unknown as Pick<PrismaClient,'$transaction'>;
 await assert.rejects(cleanupMedia(broken,{},'admin',async()=>{called=true;}),/DB_CONFLICT/);assert.equal(called,false);
});
test('image receipts reject tampering, another user, expiry and PDF receipt reuse',()=>{
 const token=signImageReceipt({userId:user,mediaId:user,path:`images/managed/${user}.png`,mimeType:'image/png',size:20,expires:2000},key);
 assert.equal(verifyImageReceipt(token,user,key,1000).size,20);
 assert.throws(()=>verifyImageReceipt(token,user,key,2000));assert.throws(()=>verifyImageReceipt(token,'22222222-2222-4222-8222-222222222222',key,1000));
 const [payload,signature]=token.split('.');const changed=JSON.parse(Buffer.from(payload,'base64url').toString());changed.size=1;assert.throws(()=>verifyImageReceipt(Buffer.from(JSON.stringify(changed)).toString('base64url')+'.'+signature,user,key,1000));
 const pdf=signUploadReceipt({userId:user,mediaId:user,path:`bulletins/managed/${user}.pdf`,size:20,expires:2000},key);assert.throws(()=>verifyImageReceipt(pdf,user,key,1000));
});
test('image decoder rejects MIME mismatch, corrupt data, oversized dimensions and SVG',async()=>{
 const image=await sharp({create:{width:20,height:10,channels:3,background:'#aaa'}}).png().toBuffer();
 assert.deepEqual(await verifyImageBytes(image,'image/png'),{width:20,height:10});
 await assert.rejects(verifyImageBytes(image,'image/jpeg'));await assert.rejects(verifyImageBytes(image.subarray(0,40),'image/png'));
 const large=await sharp({create:{width:4097,height:1,channels:3,background:'#aaa'}}).png().toBuffer();await assert.rejects(verifyImageBytes(large,'image/png'));
 await assert.rejects(verifyImageBytes(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'),'image/png'));
});
test('reserved images stay unverified until decoding; revoked users and audit failure cannot complete',async()=>{
 type Row=Record<string,unknown>;let rows:Row[]=[],logs:unknown[]=[],active=true,failAudit=false,failDecode=false;let listWhere:unknown;
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){const draft=structuredClone(rows),audit=structuredClone(logs);const result=await work({adminProfile:{findUnique:async()=>({id:'admin',role:'ADMIN',isActive:active})},media:{create:async({data}:{data:Row})=>{draft.push({...data,width:null,height:null});},findFirst:async({where}:{where:Row})=>draft.find(r=>r.id===where.id),update:async({where,data}:{where:Row;data:Row})=>{Object.assign(draft.find(r=>r.id===where.id)!,data);},findMany:async({where}:{where:unknown})=>{listWhere=where;return [];}},activityLog:{create:async(data:unknown)=>{if(failAudit)throw Error('AUDIT_FAILURE');audit.push(data);}}} as unknown as Prisma.TransactionClient);rows=draft;logs=audit;return result;}} as unknown as Pick<PrismaClient,'$transaction'>;
 const service=createMediaManagement(db,{sign:async()=> 'https://example.invalid/signed',verify:async()=>{if(failDecode)throw Error('DECODE_FAILURE');return {width:20,height:10};}},key,'https://example.invalid');
 const prepared=await service.save(user,{operation:'PREPARE_IMAGE',name:'사진.png',mimeType:'image/png',size:100});assert.ok('receipt'in prepared);assert.equal(rows[0].width,null);
 const complete={operation:'COMPLETE_IMAGE',receipt:prepared.receipt};active=false;await assert.rejects(service.save(user,complete),/권한/);active=true;failDecode=true;await assert.rejects(service.save(user,complete),/DECODE/);failDecode=false;failAudit=true;await assert.rejects(service.save(user,complete),/AUDIT/);assert.equal(rows[0].width,null);
 failAudit=false;await service.save(user,complete);await service.save(user,complete);assert.equal(rows[0].width,20);assert.equal(logs.length,1);
 await service.list(user,{});assert.deepEqual((listWhere as Row).inquiryAttachments,{none:{}});assert.deepEqual((listWhere as Row).OR,selectableMedia.OR);
});
