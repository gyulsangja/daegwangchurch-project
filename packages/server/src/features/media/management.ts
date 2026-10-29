import {randomUUID} from 'node:crypto';
import type {Media,Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {mediaCommand,mediaQuery,type ManagedMedia} from '@daegwang/contracts/media-management';
import {ContentManagementError} from '../church-content/management';
import {signImageReceipt,verifyImageReceipt} from './upload-receipt';
export const selectableMedia={bucket:'public-assets',visibility:'PUBLIC' as const,deletedAt:null,inquiryAttachments:{none:{}},OR:[{NOT:{objectPath:{startsWith:'images/managed/'}}},{width:{gt:0},height:{gt:0}}]};
export function mediaDto(row:Media,url:string):ManagedMedia{return {id:row.id,name:row.originalName,mimeType:row.mimeType,size:row.sizeBytes,width:row.width,height:row.height,url:`${url}/storage/v1/object/public/${encodeURIComponent(row.bucket)}/${row.objectPath.split('/').map(encodeURIComponent).join('/')}`};}
type Storage={sign:(path:string)=>Promise<string>;verify:(path:string,size:number,mime:string)=>Promise<{width:number;height:number}>};
export function createMediaManagement(db:Pick<PrismaClient,'$transaction'>,storage:Storage,key:string,url:string){
 async function admin(tx:Prisma.TransactionClient,userId:string){const row=await tx.adminProfile.findUnique({where:{authUserId:userId}});if(!row?.isActive||!['ADMIN','SUPER_ADMIN'].includes(row.role))throw new ContentManagementError(403,'공개 자료 관리 권한이 필요합니다.');return row;}
 return {
  async list(userId:string,raw:unknown){const input=mediaQuery.parse(raw);return db.$transaction(async tx=>{await admin(tx,userId);const rows=await tx.media.findMany({where:{...selectableMedia,mimeType:{in:['image/jpeg','image/png','image/webp']},...(input.q?{originalName:{contains:input.q,mode:'insensitive'}}:{})},orderBy:[{createdAt:'desc'},{id:'desc'}],skip:input.page*24,take:25});return {data:rows.slice(0,24).map(row=>mediaDto(row,url)),nextPage:rows.length>24?input.page+1:null};});},
  async save(userId:string,raw:unknown){
   const input=mediaCommand.parse(raw);await db.$transaction(tx=>admin(tx,userId));
   if(input.operation==='PREPARE_IMAGE'){
    const mediaId=randomUUID(),path=`images/managed/${mediaId}.${{'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[input.mimeType]}`;
    const receipt=signImageReceipt({userId,mediaId,path,mimeType:input.mimeType,size:input.size,expires:Date.now()+2*3600000},key);
    const uploadUrl=await storage.sign(path);
    await db.$transaction(async tx=>{await admin(tx,userId);await tx.media.create({data:{id:mediaId,bucket:'public-assets',objectPath:path,originalName:input.name,mimeType:input.mimeType,sizeBytes:input.size,visibility:'PUBLIC'}});});
    return {uploadUrl,receipt};
   }
   let upload;try{upload=verifyImageReceipt(input.receipt,userId,key);}catch{throw new ContentManagementError(409,'이미지 업로드 확인이 만료되었습니다. 다시 선택해 주세요.');}
   const dimensions=await storage.verify(upload.path,upload.size,upload.mimeType);
   return db.$transaction(async tx=>{
    const actor=await admin(tx,userId);const row=await tx.media.findFirst({where:{id:upload.mediaId,bucket:'public-assets',objectPath:upload.path,mimeType:upload.mimeType,sizeBytes:upload.size,visibility:'PUBLIC',deletedAt:null,inquiryAttachments:{none:{}}}});
    if(!row)throw new ContentManagementError(404,'업로드한 이미지를 찾을 수 없습니다.');
    if(!row.width||!row.height){await tx.media.update({where:{id:row.id},data:dimensions});await tx.activityLog.create({data:{actorId:actor.id,action:'CREATE',entityType:'Media',entityId:row.id,summary:'통합 관리 공개 이미지 업로드'}});}
    return {data:mediaDto({...row,...dimensions},url)};
   });
  },
 };
}
