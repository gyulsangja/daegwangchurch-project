import test from 'node:test';
import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {albumSave} from '../packages/contracts/src/album-management';
import {createAlbumManagement} from '../packages/server/src/features/church-content/album-management';
const id='11111111-1111-4111-8111-111111111111';
const input={operation:'SAVE',id,expectedUpdatedAt:null,data:{title:'교회 행사',eventDate:'2026-10-29',category:'행사',description:'함께한 날',status:'DRAFT',showOnMain:false},images:[{mediaId:'photo1',caption:'첫 사진'},{mediaId:'photo2',caption:''}],coverImageId:'photo2',publishConfirmed:false};
function fixture(){type Row=Record<string,unknown>;let album:Row|null=null,images:Row[]=[],logs:unknown[]=[];let active=true,failAudit=false,available=['photo1','photo2'];
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){let row=structuredClone(album);let pending=structuredClone(images);const audit=structuredClone(logs);
 const result=await work({adminProfile:{findUnique:async()=>({id:'admin',role:'ADMIN',isActive:active})},media:{findMany:async()=>available.map(id=>({id}))},album:{findUnique:async()=>row,create:async({data}:{data:Row})=>{row={...data,updatedAt:new Date('2026-10-29T00:00:00Z'),deletedAt:null};},updateMany:async({where,data}:{where:Row;data:Row})=>{assert.equal(where.deletedAt,null);row={...row,...data,updatedAt:new Date((row!.updatedAt as Date).getTime()+1)};return {count:1};}},albumImage:{deleteMany:async({where}:{where:{mediaId:{notIn:string[]}}})=>{pending=pending.filter(i=>where.mediaId.notIn.includes(String(i.mediaId)));},upsert:async({create,update}:{create:Row;update:Row})=>{const found=pending.find(i=>i.mediaId===create.mediaId);if(found)Object.assign(found,update);else pending.push({id:'link-'+create.mediaId,...create});}},activityLog:{create:async(data:unknown)=>{if(failAudit)throw Error('AUDIT_FAILED');audit.push(data);}}} as unknown as Prisma.TransactionClient);album=row;images=pending;logs=audit;return result;}} as unknown as Pick<PrismaClient,'$transaction'>;
 return {service:createAlbumManagement(db,'https://example.invalid'),read:()=>({album:album!,images,logs}),revoke:()=>{active=false;},failAudit:()=>{failAudit=true;},missing:()=>{available=['photo1'];}};
}
test('album saves preserve original ID/slug and photo link identity while ordering/caption/cover change atomically',async()=>{
 const f=fixture();await f.service.save('admin',input);const before=f.read(),version=(before.album.updatedAt as Date).toISOString();
 await assert.rejects(f.service.save('admin',input),/이미 저장/);
 const edit={...input,expectedUpdatedAt:version,images:[input.images[1],{mediaId:'photo1',caption:'새 설명'}],coverImageId:'photo1',data:{...input.data,title:'새 제목',status:'PUBLISHED'},publishConfirmed:true};await f.service.save('admin',edit);const after=f.read();assert.equal(after.album.slug,before.album.slug);assert.equal(after.album.id,id);assert.equal(after.album.coverImageId,'photo1');assert.equal(after.images.find(i=>i.mediaId==='photo1')!.id,'link-photo1');assert.equal(after.images.find(i=>i.mediaId==='photo1')!.sortOrder,1);assert.equal(after.images.find(i=>i.mediaId==='photo1')!.caption,'새 설명');
 await assert.rejects(f.service.save('admin',edit),/다른 화면/);f.failAudit();await assert.rejects(f.service.save('admin',{operation:'DELETE',id,expectedUpdatedAt:(after.album.updatedAt as Date).toISOString(),confirmed:true}),/AUDIT/);assert.equal(f.read().album.deletedAt,null);assert.equal(f.read().images.length,2);
});
test('album publication, media references, revoked access and delete confirmation are checked',async()=>{
 assert.equal(albumSave.safeParse({...input,data:{...input.data,status:'PUBLISHED'}}).success,false);assert.equal(albumSave.safeParse({...input,coverImageId:'other'}).success,false);assert.equal(albumSave.safeParse({...input,images:[input.images[0],input.images[0]]}).success,false);
 const f=fixture();f.missing();await assert.rejects(f.service.save('admin',input),/사진/);assert.equal(f.read().album,null);f.revoke();await assert.rejects(f.service.save('admin',input),/권한/);await assert.rejects(f.service.list('admin',{}),/권한/);
 const g=fixture();await g.service.save('admin',input);const version=(g.read().album.updatedAt as Date).toISOString();await g.service.save('admin',{operation:'DELETE',id,expectedUpdatedAt:version,confirmed:true});assert.ok(g.read().album.deletedAt);assert.equal(g.read().images.length,2);
});
