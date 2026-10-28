import {randomUUID} from 'node:crypto';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {prepareBulletinPdf,bulletinPdfSave} from '@daegwang/contracts/bulletin-upload';
import {ContentManagementError} from '../church-content/management';
import {rememberBulletinFile} from './file-history';
import {signUploadReceipt,verifyUploadReceipt} from './upload-receipt';
type Storage={sign:(path:string)=>Promise<string>;verify:(path:string,size:number)=>Promise<void>};
export function createBulletinUploadManagement(db:Pick<PrismaClient,'$transaction'>,storage:Storage,key:string){
 async function authorize(tx:Prisma.TransactionClient,userId:string){const row=await tx.adminProfile.findUnique({where:{authUserId:userId}});if(!row?.isActive||!['ADMIN','SUPER_ADMIN'].includes(row.role))throw new ContentManagementError(403,'자료 관리 권한이 필요합니다.');return row;}
 return async(userId:string,raw:unknown)=>{
  await db.$transaction(tx=>authorize(tx,userId));
  if(raw&&typeof raw==='object'&&'operation'in raw&&raw.operation==='PREPARE_PDF'){
   const input=prepareBulletinPdf.parse(raw);const mediaId=randomUUID();const path=`bulletins/managed/${mediaId}.pdf`;
   const receipt=signUploadReceipt({userId,mediaId,path,size:input.size,expires:Date.now()+2*3600000},key);
   const uploadUrl=await storage.sign(path);
   await db.$transaction(async tx=>{await authorize(tx,userId);await tx.media.create({data:{id:mediaId,bucket:'public-assets',objectPath:path,originalName:input.name,mimeType:'application/pdf',sizeBytes:input.size,visibility:'PUBLIC'}});});
   return {uploadUrl,receipt};
  }
  const input=bulletinPdfSave.parse(raw);let upload;
  try{upload=verifyUploadReceipt(input.receipt,userId,key);}catch{throw new ContentManagementError(409,'업로드 확인이 만료되었습니다. 파일을 다시 선택해 주세요.');}
  await storage.verify(upload.path,upload.size);
  return db.$transaction(async tx=>{
   const actor=await authorize(tx,userId);
   const media=await tx.media.findFirst({where:{id:upload.mediaId,objectPath:upload.path,bucket:'public-assets',sizeBytes:upload.size,mimeType:'application/pdf',deletedAt:null,visibility:'PUBLIC'}});
   if(!media)throw new ContentManagementError(404,'업로드한 파일을 찾을 수 없습니다.');
   const current=await tx.bulletin.findFirst({where:{id:input.id}});
   if(input.expectedUpdatedAt===null?!!current:!current||!!current.deletedAt||current.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new ContentManagementError(409,'이미 저장되었거나 다른 화면에서 수정되었습니다. 다시 열어 주세요.');
   const data={title:input.title,worshipDate:new Date(input.worshipDate+'T00:00:00Z'),summary:input.summary??null,status:input.status,pdfMediaId:media.id,publishedAt:input.status==='PUBLISHED'?current?.publishedAt??new Date():null};
   if(current){const changed=await tx.bulletin.updateMany({where:{id:current.id,deletedAt:null,updatedAt:current.updatedAt},data});if(changed.count!==1)throw new ContentManagementError(409,'다른 화면에서 수정되었습니다. 다시 열어 주세요.');await rememberBulletinFile(tx,current);}
   else await tx.bulletin.create({data:{id:input.id,slug:`bulletin-${input.worshipDate}-${input.id}`,...data}});
   const saved=await tx.bulletin.findUniqueOrThrow({where:{id:input.id}});await rememberBulletinFile(tx,saved);
   await tx.activityLog.create({data:{actorId:actor.id,action:current?'UPDATE':'CREATE',entityType:'Bulletin',entityId:input.id,summary:current?'통합 관리에서 주보 파일 교체':'통합 관리에서 주보 등록',changes:{mediaId:media.id,previousMediaId:current?.pdfMediaId??null}}});
   return {saved:true};
  });
 };
}
