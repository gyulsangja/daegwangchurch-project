import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {worshipManagementSave,worshipManagementQuery,worshipMonthRange,parseWorshipResourceRefs,type WorshipManagementRow} from '@daegwang/contracts/worship-management';
import {ContentManagementError} from './management';
import {publicAttachmentUrl} from '../notices/app-query-core';
import {rememberBulletinFile} from '../bulletins/file-history';
import {createWorshipService} from '../worship/service-core';
export function createWorshipManagement(db:Pick<PrismaClient,'$transaction'>,storageUrl?:string){
 async function authorize(tx:Prisma.TransactionClient,userId:string){
  const actor=await tx.adminProfile.findUnique({where:{authUserId:userId}});
  if(!actor?.isActive||!['ADMIN','SUPER_ADMIN'].includes(actor.role))throw new ContentManagementError(403,'기존 홈페이지·앱 관리 권한이 필요합니다.');
  return actor;
 }
 return {
  async list(userId:string,raw:unknown){
   const input=worshipManagementQuery.parse(raw);const range=worshipMonthRange(input.month);
   return db.$transaction(async tx=>{
    await authorize(tx,userId);
    if(input.kind==='VIDEO_DETAIL'){
     const row=await tx.worshipContent.findFirst({where:{id:input.id,deletedAt:null},select:{id:true,updatedAt:true,type:true,title:true,contentDate:true,youtubeUrl:true,preacher:true,scripture:true,description:true,summary:true,status:true,isPinned:true}});
     if(!row)throw new ContentManagementError(404,'말씀을 찾을 수 없습니다.');
     return {video:{id:row.id,expectedUpdatedAt:row.updatedAt.toISOString(),type:row.type,title:row.title,contentDate:row.contentDate.toISOString().slice(0,10),youtubeUrl:row.youtubeUrl,preacher:row.preacher??'',scripture:row.scripture??'',description:row.description??'',summary:row.summary??'',status:row.status,isPinned:row.isPinned}};
    }
    if(input.kind==='HISTORY'){
     const current=await tx.bulletin.findFirst({where:{id:input.id,deletedAt:null},select:{id:true,pdfMediaId:true,updatedAt:true,pdfMedia:true}});
     if(!current)throw new ContentManagementError(404,'주보를 찾을 수 없습니다.');
     const versions=await tx.bulletinFileVersion.findMany({where:{bulletinId:current.id,media:{deletedAt:null,visibility:'PUBLIC'}},include:{media:true},orderBy:[{capturedAt:'desc'},{id:'desc'}],skip:input.page*20,take:21});
     const visible=versions.slice(0,20);const files=visible.map(v=>({id:v.id,name:v.media.originalName,url:publicAttachmentUrl(storageUrl,v.media.bucket,v.media.objectPath),capturedAt:v.capturedAt.toISOString(),isCurrent:v.mediaId===current.pdfMediaId}));
     if(input.page===0&&!versions.length&&!current.pdfMedia.deletedAt&&current.pdfMedia.visibility==='PUBLIC')files.push({id:'current',name:current.pdfMedia.originalName,url:publicAttachmentUrl(storageUrl,current.pdfMedia.bucket,current.pdfMedia.objectPath),capturedAt:current.updatedAt.toISOString(),isCurrent:true});
     return {files,nextPage:versions.length>20?input.page+1:null};
    }
    const refs=input.kind==='RESOURCES'?parseWorshipResourceRefs(input.refs):null;
    async function read(kind:'BULLETIN'|'WORSHIP',page:number){
     const ids=refs?.filter(r=>r.kind===kind).map(r=>r.id);
     if(ids&&!ids.length)return {data:[] as WorshipManagementRow[],nextPage:null};
     let rows:WorshipManagementRow[];
     if(kind==='BULLETIN'){
     const values=await tx.bulletin.findMany({where:{deletedAt:null,...(ids?{id:{in:ids}}:input.id?{id:input.id}:{worshipDate:range})},orderBy:[{worshipDate:'desc'},{id:'desc'}],skip:ids?0:page*30,take:ids?50:31,select:{id:true,title:true,worshipDate:true,status:true,updatedAt:true,summary:true,worshipContentId:true,worshipContent:{select:{title:true,deletedAt:true}}}});
     rows=values.map(r=>({id:r.id,kind:'BULLETIN',title:r.title,date:r.worshipDate.toISOString().slice(0,10),status:r.status,updatedAt:r.updatedAt.toISOString(),summary:r.summary??'',worshipContentId:r.worshipContentId,linkedTitle:r.worshipContent&&!r.worshipContent.deletedAt?r.worshipContent.title:null,type:'주보',preacher:'',scripture:'',videoId:null}));
    }else{
     const values=await tx.worshipContent.findMany({where:{deletedAt:null,...(ids?{id:{in:ids}}:input.id?{id:input.id}:{contentDate:range})},orderBy:[{contentDate:'desc'},{id:'desc'}],skip:ids?0:page*30,take:ids?50:31,select:{id:true,title:true,type:true,contentDate:true,status:true,updatedAt:true,summary:true,preacher:true,scripture:true,youtubeVideoId:true}});
     rows=values.map(r=>({id:r.id,kind:'WORSHIP',title:r.title,date:r.contentDate.toISOString().slice(0,10),status:r.status,updatedAt:r.updatedAt.toISOString(),summary:r.summary??'',worshipContentId:null,linkedTitle:null,type:r.type,preacher:r.preacher??'',scripture:r.scripture??'',videoId:r.youtubeVideoId}));
    }
     return {data:ids?rows:rows.slice(0,30),nextPage:!ids&&rows.length>30?page+1:null};
    }
    if(input.kind==='ALL'){const BULLETIN=await read('BULLETIN',input.bulletinPage);const WORSHIP=await read('WORSHIP',input.worshipPage);return {BULLETIN,WORSHIP};}
    if(input.kind==='RESOURCES')return {data:[...(await read('BULLETIN',0)).data,...(await read('WORSHIP',0)).data],nextPage:null};
    return read(input.kind,input.page);
   });
  },
  async save(userId:string,raw:unknown){
   const input=worshipManagementSave.parse(raw);
   return db.$transaction(async tx=>{
    const actor=await authorize(tx,userId);
    if('operation'in input&&input.operation==='DELETE_SOURCE'){
     if(input.kind==='WORSHIP'){
      const service=createWorshipService({$transaction:async(work:(inner:Prisma.TransactionClient)=>Promise<unknown>)=>work(tx)} as Pick<PrismaClient,'$transaction'>);
      try{await service.delete({adminId:actor.id},input.id,input.expectedUpdatedAt);}catch(e){if(e instanceof Error&&['CONFLICT','NOT_FOUND'].includes(e.message))throw new ContentManagementError(409,'자료가 변경되었습니다. 목록을 새로고침해 주세요.');throw e;}
     }else{
      const changed=await tx.bulletin.updateMany({where:{id:input.id,deletedAt:null,updatedAt:new Date(input.expectedUpdatedAt)},data:{deletedAt:new Date()}});
      if(changed.count!==1)throw new ContentManagementError(409,'자료가 변경되었습니다. 목록을 새로고침해 주세요.');
      await tx.activityLog.create({data:{actorId:actor.id,action:'DELETE',entityType:'Bulletin',entityId:input.id,summary:'통합 관리에서 주보 삭제 (파일·이력 보존)'}});
     }
     return {saved:true};
    }
    if('operation'in input&&input.operation==='SAVE_VIDEO'){
     // Reuse publication + audit logic in this already-authorized transaction.
     const service=createWorshipService({$transaction:async(work:(inner:Prisma.TransactionClient)=>Promise<unknown>)=>work(tx)} as Pick<PrismaClient,'$transaction'>);
     const data={...input,sermonTitle:input.title,preacher:input.preacher??'',scripture:input.scripture??'',description:input.description??'',summary:input.summary??''};
     try{if(input.expectedUpdatedAt===null)await service.create({adminId:actor.id},data,input.id);else await service.update({adminId:actor.id},input.id,data,input.expectedUpdatedAt);}
     catch(e){if(e instanceof Error&&e.message==='CONFLICT')throw new ContentManagementError(409,'이미 저장되었거나 다른 화면에서 수정되었습니다. 목록을 새로고침해 주세요.');if(e instanceof Error&&e.message==='NOT_FOUND')throw new ContentManagementError(404,'말씀을 찾을 수 없습니다.');if(e&&typeof e==='object'&&'code'in e&&e.code==='P2002')throw new ContentManagementError(409,'같은 날짜·유형의 영상이 이미 등록되어 있습니다. 기존 자료를 확인해 주세요.');throw e;}
     return {saved:true};
    }
    const current=await tx.bulletin.findFirst({where:{id:input.id,deletedAt:null}});
    if(!current)throw new ContentManagementError(404,'주보를 찾을 수 없습니다.');
    if(current.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new ContentManagementError(409,'다른 화면에서 수정되었습니다. 다시 열어 주세요.');
    if('operation'in input){
     if(current.status==='PUBLISHED'&&!input.publishConfirmed)throw new ContentManagementError(409,'공개 주보의 파일 변경을 확인해 주세요.');
     const version=await tx.bulletinFileVersion.findFirst({where:{id:input.versionId,bulletinId:current.id,media:{deletedAt:null,visibility:'PUBLIC',mimeType:'application/pdf'}}});
     if(!version)throw new ContentManagementError(404,'보관된 파일을 찾을 수 없습니다.');
     if((await tx.bulletin.updateMany({where:{id:current.id,deletedAt:null,updatedAt:current.updatedAt},data:{pdfMediaId:version.mediaId}})).count!==1)throw new ContentManagementError(409,'다른 화면에서 수정되었습니다. 다시 열어 주세요.');
     await rememberBulletinFile(tx,current);
     await tx.activityLog.create({data:{actorId:actor.id,action:'UPDATE',entityType:'Bulletin',entityId:current.id,summary:'이전 주보 파일로 복원',changes:{previousMediaId:current.pdfMediaId,mediaId:version.mediaId}}});
     return {saved:true};
    }
    if(input.worshipContentId!==null&&input.worshipContentId!==current.worshipContentId&&!await tx.worshipContent.findFirst({where:{id:input.worshipContentId,deletedAt:null},select:{id:true}}))throw new ContentManagementError(404,'연결할 말씀을 찾을 수 없습니다.');
    const result=await tx.bulletin.updateMany({where:{id:input.id,deletedAt:null,updatedAt:new Date(input.expectedUpdatedAt)},data:{title:input.title,worshipDate:new Date(`${input.worshipDate}T00:00:00.000Z`),summary:input.summary??null,worshipContentId:input.worshipContentId,status:input.status,publishedAt:input.status==='PUBLISHED'?current.publishedAt??new Date():null}});
    if(result.count!==1)throw new ContentManagementError(409,'다른 화면에서 수정되었습니다. 다시 열어 주세요.');
    await tx.activityLog.create({data:{actorId:actor.id,action:'UPDATE',entityType:'Bulletin',entityId:input.id,summary:'통합 예배 자료에서 주보 수정',changes:{previousStatus:current.status,nextStatus:input.status,previousWorshipContentId:current.worshipContentId,worshipContentId:input.worshipContentId}}});
    return {saved:true};
   });
  },
 };
}
