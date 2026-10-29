import test from 'node:test';
import assert from 'node:assert/strict';
import type {PrismaClient,Prisma,Event,Notice} from '@daegwang/database/generated/client';
import {createContentManagement} from '../packages/server/src/features/church-content/management';
import {createContentManagementHandler} from '../packages/server/src/features/church-content/management-api';
import {contentSave} from '../packages/contracts/src/church-content-management';
import {parseEventFormData} from '../packages/contracts/src/features/events/schema';
import {parseNoticeFormData} from '../packages/contracts/src/features/notices/schema';
const id='11111111-1111-4111-8111-111111111111';
const timestamp=new Date('2026-10-28T01:00:00.000Z');
const eventData={title:'Test event',category:'Test',startsAt:'2026-10-28T09:00:00+09:00',endsAt:'',isAllDay:false,location:'',ministryName:'',description:'Public details',status:'DRAFT'};
function fixture(){
 let state:{event:Event|null;notice:(Notice&{_count:{attachments:number}})|null;logs:unknown[];active:boolean}={event:null,notice:null,logs:[],active:true};
 let auditFailure=false;let availableMedia:string[]=[];let attachments:string[]=[];
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){
  const draft=structuredClone(state);let draftAttachments=[...attachments];
  const model=(kind:'event'|'notice')=>({
   findUnique:async()=>draft[kind],findUniqueOrThrow:async()=>draft[kind],findMany:async()=>draft[kind]?[draft[kind]]:[],
   create:async({data}:{data:Record<string,unknown>})=>{
    const row={id,slug:'unchanged-slug',createdAt:timestamp,updatedAt:timestamp,deletedAt:null,publishedAt:null,coverImageId:'KEEP_COVER',_count:{attachments:2},...data};
    if(kind==='event')draft.event=row as unknown as Event;else draft.notice=row as unknown as Notice&{_count:{attachments:number}};
    return row;
   },
   updateMany:async({where,data}:{where:{id:string;updatedAt:Date;deletedAt:null};data:Record<string,unknown>})=>{
    const row=draft[kind];assert.equal(where.deletedAt,null);if(!row||row.updatedAt.getTime()!==where.updatedAt.getTime())return {count:0};
    Object.assign(row,data,{updatedAt:new Date(row.updatedAt.getTime()+1)});return {count:1};
   },
  });
  const tx={media:{findMany:async({where}:{where:{id:{in:string[]}}})=>availableMedia.filter(id=>where.id.in.includes(id)).map(id=>({id,mimeType:'image/png'}))},noticeAttachment:{deleteMany:async()=>{draftAttachments=[];},createMany:async({data}:{data:{mediaId:string}[]})=>{draftAttachments=data.map(row=>row.mediaId);}},adminProfile:{findUnique:async({where}:{where:{authUserId:string}})=>where.authUserId==='operator'?{id:'admin',role:'ADMIN',isActive:draft.active}:null},event:model('event'),notice:model('notice'),activityLog:{create:async(data:unknown)=>{if(auditFailure)throw new Error('audit failed');draft.logs.push(data);}}} as unknown as Prisma.TransactionClient;
  const result=await work(tx);state=draft;attachments=draftAttachments;return result;
 }} as unknown as Pick<PrismaClient,'$transaction'>;
 return {setMedia:(ids:string[])=>{availableMedia=ids;},attachments:()=>attachments,service:createContentManagement(db),read:()=>state,revoke:()=>{state.active=false;},failAudit:()=>{auditFailure=true;}};
}
test('same event source retains ID, slug and image; retries and stale updates cannot overwrite',async()=>{
 const f=fixture();const input={kind:'EVENT',id,expectedUpdatedAt:null,data:eventData};
 await assert.rejects(f.service.save('member',input),/권한/);
 const created=await f.service.save('operator',input);
 await assert.rejects(f.service.save('operator',input),/이미 저장/);
 const slug=f.read().event!.slug;
 await f.service.save('operator',{...input,expectedUpdatedAt:created.data.updatedAt,publishConfirmed:true,data:{...eventData,title:'Changed',status:'PUBLISHED'}});
 assert.equal(f.read().event!.id,id);assert.equal(f.read().event!.slug,slug);assert.equal(f.read().event!.coverImageId,'KEEP_COVER');assert.ok(f.read().event!.publishedAt);
 await assert.rejects(f.service.save('operator',{...input,expectedUpdatedAt:created.data.updatedAt}),/다른 담당자/);
 const version=f.read().event!.updatedAt.toISOString();
 await f.service.save('operator',{...input,expectedUpdatedAt:version,data:{...eventData,status:'PRIVATE'}});
 assert.equal(f.read().event!.publishedAt,null);
 f.revoke();await assert.rejects(f.service.list('operator',{kind:'EVENT'}),/권한/);await assert.rejects(f.service.save('operator',{...input,expectedUpdatedAt:version}),/권한/);
});
test('notice editing preserves attachment count and rolls back on audit failure',async()=>{
 const f=fixture();const input={kind:'NOTICE',id,expectedUpdatedAt:null,data:{title:'Notice',category:'Test',body:'Public body',status:'DRAFT',isImportant:false,isPinned:false,publishStartsAt:'',publishEndsAt:''}};
 const created=await f.service.save('operator',input);assert.equal(created.data.attachmentCount,2);
 f.failAudit();await assert.rejects(f.service.save('operator',{...input,expectedUpdatedAt:created.data.updatedAt,data:{...input.data,body:'Changed'}}),/audit/);
 assert.deepEqual(f.read().notice!.content,{body:'Public body'});assert.equal(f.read().logs.length,1);
});
test('management API rejects cookie-only, browser-origin, invalid identities and oversized bodies',async()=>{
 let saves=0;
 const handle=createContentManagementHandler({authenticate:async t=>t==='valid'?'operator':null,list:async()=>({data:[],nextPage:null}),save:async()=>{saves++;return {};}});
 const url='https://example.test/api/manage/church-content?kind=EVENT';
 assert.equal((await handle(new Request(url,{headers:{Cookie:'session=ignored'}}))).status,401);
 assert.equal((await handle(new Request(url,{headers:{Authorization:'Bearer valid',Origin:'https://other.test'}}))).status,403);
 assert.equal((await handle(new Request(url,{headers:{Authorization:'Bearer invalid'}}))).status,401);
 assert.equal((await handle(new Request(url,{method:'POST',headers:{Authorization:'Bearer valid','Content-Type':'application/json'},body:'x'.repeat(100001)}))).status,413);
 assert.equal(saves,0);
 const good=await handle(new Request(url,{headers:{Authorization:'Bearer valid'}}));assert.equal(good.status,200);assert.equal(good.headers.get('cache-control'),'no-store');assert.equal(good.headers.get('access-control-allow-origin'),null);
 assert.equal((await handle(new Request(url+'&kind=NOTICE',{headers:{Authorization:'Bearer valid'}}))).status,422);
 assert.equal(contentSave.safeParse({kind:'EVENT',id,expectedUpdatedAt:null,data:{...eventData,startsAt:'2026-10-28T09:00'}}).success,false);
 assert.equal(contentSave.safeParse({kind:'EVENT',id:'invalid-new-id',expectedUpdatedAt:null,data:eventData}).success,false);
 assert.equal(contentSave.safeParse({kind:'EVENT',id,expectedUpdatedAt:null,data:{...eventData,status:'PUBLISHED'}}).success,false);
});
test('existing CMS forms and ministry editor agree on Korea time on UTC servers',()=>{
 const event=new FormData();for(const [key,value] of Object.entries({...eventData,startsAt:'2026-10-28T09:00'}))event.set(key,String(value));
 const parsed=parseEventFormData(event);assert.ok(parsed.success);assert.equal(new Date(parsed.data.startsAt).toISOString(),'2026-10-28T00:00:00.000Z');
 const notice=new FormData();for(const [key,value] of Object.entries({title:'Test',category:'Test',body:'Body',status:'DRAFT',publishStartsAt:'2026-10-28T09:00',publishEndsAt:'2026-10-29T09:00'}))notice.set(key,value);
 const result=parseNoticeFormData(notice);assert.ok(result.success);assert.equal(new Date(result.data.publishStartsAt!).toISOString(),'2026-10-28T00:00:00.000Z');
});

test('attachment replacement is ordered, versioned, reference-only and atomic with audit',async()=>{
 const f=fixture();f.setMedia(['first','second']);
 const input={kind:'NOTICE',id,expectedUpdatedAt:null,attachmentIds:['second','first'],data:{title:'사진 공지',category:'소식',body:'안내',status:'DRAFT',isImportant:false,isPinned:false,publishStartsAt:'',publishEndsAt:''}};
 const saved=await f.service.save('operator',input);assert.deepEqual(f.attachments(),['second','first']);
 await assert.rejects(f.service.save('operator',{...input,expectedUpdatedAt:saved.data.updatedAt,attachmentIds:['private-or-unverified']}),/업로드/);assert.deepEqual(f.attachments(),['second','first']);
 f.failAudit();await assert.rejects(f.service.save('operator',{...input,expectedUpdatedAt:saved.data.updatedAt,attachmentIds:[]}),/audit/);assert.deepEqual(f.attachments(),['second','first']);
 assert.equal(contentSave.safeParse({...input,attachmentIds:['first','first']}).success,false);
});
