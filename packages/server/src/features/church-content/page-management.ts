import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {fixedPageQuery,fixedPageCommand,fixedPageInfo,pageEditorValues,fixedPageContent} from '@daegwang/contracts/page-management';
import {ContentManagementError} from './management';
export function createFixedPageManagement(db:Pick<PrismaClient,'$transaction'>){
 async function authorize(tx:Prisma.TransactionClient,user:string){const actor=await tx.adminProfile.findUnique({where:{authUserId:user}});if(!actor?.isActive)throw new ContentManagementError(403,'홈페이지 관리 권한이 필요합니다.');return actor;}
 return {
  async list(user:string,raw:unknown){const {kind}=fixedPageQuery.parse(raw);return db.$transaction(async tx=>{await authorize(tx,user);const row=await tx.page.findUnique({where:{key:fixedPageInfo[kind].key}});return {kind,expectedUpdatedAt:row?.updatedAt.toISOString()??null,values:pageEditorValues(kind,row?.content??null,row?.deletedAt?'PRIVATE':row?.status??'DRAFT')};});},
  async save(user:string,raw:unknown){const input=fixedPageCommand.parse(raw),info=fixedPageInfo[input.kind],value=fixedPageContent(input);return db.$transaction(async tx=>{
   const actor=await authorize(tx,user);await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${info.key}::text, 0))`;
   const old=await tx.page.findUnique({where:{key:info.key}});if((old?.updatedAt.toISOString()??null)!==input.expectedUpdatedAt)throw new ContentManagementError(409,'다른 화면에서 페이지가 변경되었습니다. 최신 내용을 다시 불러와 주세요.');
   const content={...(old?.content&&typeof old.content==='object'&&!Array.isArray(old.content)?old.content:{}),...value.content} as Prisma.InputJsonObject;
   const data={title:info.title,description:value.description,content,status:value.status,deletedAt:null,publishedAt:value.status==='PUBLISHED'?old?.publishedAt??new Date():null};
   const row=await tx.page.upsert({where:{key:info.key},create:{key:info.key,...data},update:data});await tx.activityLog.create({data:{actorId:actor.id,action:old?'UPDATE':'CREATE',entityType:'Page',entityId:row.id,summary:`고정 페이지 '${info.title}' 저장`,changes:{status:value.status}}});return {saved:true,expectedUpdatedAt:row.updatedAt.toISOString()};
  });},
 };
}
