import {randomUUID} from 'node:crypto';
import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {prepareDocument,completeDocument,documentTypes} from '@daegwang/contracts/document-upload';
import {ContentManagementError} from '../church-content/management';
import {mediaDto} from './management';
import {signDocumentReceipt,verifyDocumentReceipt} from './document-receipt';
export function createDocumentManagement(db:Pick<PrismaClient,'$transaction'>,storage:{sign:(path:string)=>Promise<string>;verifyDocument:(path:string,size:number,extension:keyof typeof documentTypes)=>Promise<void>},key:string,url:string){
 async function admin(tx:Prisma.TransactionClient,user:string){const a=await tx.adminProfile.findUnique({where:{authUserId:user}});if(!a?.isActive||!['ADMIN','SUPER_ADMIN'].includes(a.role))throw new ContentManagementError(403,'첨부 자료 관리 권한이 필요합니다.');return a;}
 return async(user:string,raw:unknown)=>{
  await db.$transaction(tx=>admin(tx,user));
  const prepared=prepareDocument.safeParse(raw);
  if(prepared.success){const input=prepared.data,id=randomUUID(),path=`documents/managed/${id}.${input.extension}`;const receipt=signDocumentReceipt({userId:user,mediaId:id,path,extension:input.extension,size:input.size,expires:Date.now()+2*3600000},key);const uploadUrl=await storage.sign(path);
   await db.$transaction(async tx=>{await admin(tx,user);await tx.media.create({data:{id,bucket:'public-assets',objectPath:path,originalName:input.name,mimeType:documentTypes[input.extension],sizeBytes:input.size,visibility:'PRIVATE'}});});return {uploadUrl,receipt};
  }
  const input=completeDocument.parse(raw);let upload;try{upload=verifyDocumentReceipt(input.receipt,user,key);}catch{throw new ContentManagementError(409,'파일 확인이 만료되었습니다. 다시 올려 주세요.');}
  await storage.verifyDocument(upload.path,upload.size,upload.extension);
  return db.$transaction(async tx=>{const actor=await admin(tx,user);const row=await tx.media.findFirst({where:{id:upload.mediaId,bucket:'public-assets',objectPath:upload.path,sizeBytes:upload.size,mimeType:documentTypes[upload.extension],deletedAt:null,inquiryAttachments:{none:{}}}});if(!row)throw new ContentManagementError(404,'첨부 파일을 찾을 수 없습니다.');
   if(row.visibility!=='PUBLIC'){await tx.media.update({where:{id:row.id},data:{visibility:'PUBLIC'}});await tx.activityLog.create({data:{actorId:actor.id,action:'CREATE',entityType:'Media',entityId:row.id,summary:'통합 관리 공개 문서 업로드'}});}return {data:mediaDto({...row,visibility:'PUBLIC'},url)};
  });
 };
}
