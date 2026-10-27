import {randomUUID} from 'node:crypto';
import {Prisma,type PrismaClient,type Event,type Notice} from '@daegwang/database/generated/client';
import {createContentSlug} from '@daegwang/contracts/content-slug';
import {contentQuery,contentSave,type ContentRow} from '@daegwang/contracts/church-content-management';

export class ContentManagementError extends Error {
 constructor(public status:403|404|409,message:string){super(message);}
}
function body(value:Prisma.JsonValue|null){return typeof value==='string'?value:value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.body==='string'?value.body:'';}
function withBody(value:Prisma.JsonValue|null,text:string):Prisma.InputJsonValue {return {...(value&&typeof value==='object'&&!Array.isArray(value)?value:{}),body:text};}
function dto(kind:'EVENT'|'NOTICE',row:Event|Notice,attachments=0):ContentRow {
 return {id:row.id,kind,title:row.title,category:row.category,status:row.status,updatedAt:row.updatedAt.toISOString(),body:body('content'in row?row.content:row.description),
 startsAt:'startsAt'in row?row.startsAt.toISOString():'',endsAt:'endsAt'in row?row.endsAt?.toISOString()??'':'',isAllDay:'isAllDay'in row?row.isAllDay:false,location:'location'in row?row.location??'':'',ministryName:'ministryName'in row?row.ministryName??'':'',
 isImportant:'isImportant'in row?row.isImportant:false,isPinned:'isPinned'in row?row.isPinned:false,publishStartsAt:'publishStartsAt'in row?row.publishStartsAt?.toISOString()??'':'',publishEndsAt:'publishEndsAt'in row?row.publishEndsAt?.toISOString()??'':'',attachmentCount:attachments};
}
export function createContentManagement(db:Pick<PrismaClient,'$transaction'>){
 async function admin(tx:Prisma.TransactionClient,userId:string){
  const row=await tx.adminProfile.findUnique({where:{authUserId:userId}});
  if(!row?.isActive||!['ADMIN','SUPER_ADMIN'].includes(row.role))throw new ContentManagementError(403,'기존 홈페이지·앱 콘텐츠 관리 권한이 필요합니다.');
  return row;
 }
 return {
  async list(userId:string,raw:unknown){
   const input=contentQuery.parse(raw);
   return db.$transaction(async tx=>{
    await admin(tx,userId);
    const where={deletedAt:null,...(input.id?{id:input.id}:{}),...(input.q?{title:{contains:input.q,mode:'insensitive' as const}}:{})};
    const args={where,orderBy:[{updatedAt:'desc' as const},{id:'desc' as const}],skip:input.page*20,take:21};
    const rows=input.kind==='EVENT'?(await tx.event.findMany(args)).map(r=>dto('EVENT',r)):(await tx.notice.findMany({...args,include:{_count:{select:{attachments:true}}}})).map(r=>dto('NOTICE',r,r._count.attachments));
    return {data:rows.slice(0,20),nextPage:rows.length>20?input.page+1:null};
   });
  },
  async save(userId:string,raw:unknown){
   const input=contentSave.parse(raw);
   try{return await db.$transaction(async tx=>{
    const actor=await admin(tx,userId);
    const create=input.expectedUpdatedAt===null;
    const current=input.kind==='EVENT'?await tx.event.findUnique({where:{id:input.id}}):await tx.notice.findUnique({where:{id:input.id}});
    if(create&&current)throw new ContentManagementError(409,'이미 저장된 게시물입니다. 목록에서 확인해 주세요.');
    if(!create&&(!current||current.deletedAt))throw new ContentManagementError(404,'게시물을 찾을 수 없습니다.');
    if(!create&&current!.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new ContentManagementError(409,'다른 담당자가 수정했습니다. 다시 열어 확인해 주세요.');
    const publishedAt=input.data.status==='PUBLISHED'?current?.publishedAt??new Date():null;
    const slug=current?.slug??createContentSlug(input.data.title,input.kind.toLowerCase(),randomUUID());
    let saved:ContentRow;
    if(input.kind==='EVENT'){
     const d=input.data;
     const data={title:d.title,category:d.category,startsAt:new Date(d.startsAt),endsAt:d.endsAt?new Date(d.endsAt):null,isAllDay:d.isAllDay,location:d.location??null,ministryName:d.ministryName??null,description:withBody(current&&'description'in current?current.description:null,d.description??''),status:d.status,publishedAt};
     if(create)await tx.event.create({data:{...data,id:input.id,slug}});
     else if((await tx.event.updateMany({where:{id:input.id,deletedAt:null,updatedAt:new Date(input.expectedUpdatedAt!)},data})).count!==1)throw new ContentManagementError(409,'다른 담당자가 수정했습니다. 다시 열어 확인해 주세요.');
     saved=dto('EVENT',await tx.event.findUniqueOrThrow({where:{id:input.id}}));
    }else{
     const d=input.data;
     const data={title:d.title,category:d.category,content:withBody(current&&'content'in current?current.content:null,d.body),status:d.status,isImportant:d.isImportant,isPinned:d.isPinned,publishStartsAt:d.publishStartsAt?new Date(d.publishStartsAt):null,publishEndsAt:d.publishEndsAt?new Date(d.publishEndsAt):null,publishedAt};
     if(create)await tx.notice.create({data:{...data,id:input.id,slug}});
     else if((await tx.notice.updateMany({where:{id:input.id,deletedAt:null,updatedAt:new Date(input.expectedUpdatedAt!)},data})).count!==1)throw new ContentManagementError(409,'다른 담당자가 수정했습니다. 다시 열어 확인해 주세요.');
     const row=await tx.notice.findUniqueOrThrow({where:{id:input.id},include:{_count:{select:{attachments:true}}}});
     saved=dto('NOTICE',row,row._count.attachments);
    }
    await tx.activityLog.create({data:{actorId:actor.id,action:create?'CREATE':'UPDATE',entityType:input.kind==='EVENT'?'Event':'Notice',entityId:input.id,summary:'목회시스템에서 교회 콘텐츠 저장',changes:{previousStatus:current?.status??null,nextStatus:input.data.status}}});
    return {data:saved};
   });}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')throw new ContentManagementError(409,'이미 저장된 게시물입니다. 목록에서 확인해 주세요.');throw error;}
  },
 };
}
