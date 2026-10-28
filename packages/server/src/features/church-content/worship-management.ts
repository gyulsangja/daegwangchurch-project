import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {bulletinManagementSave,worshipManagementQuery,worshipMonthRange,type WorshipManagementRow} from '@daegwang/contracts/worship-management';
import {ContentManagementError} from './management';
export function createWorshipManagement(db:Pick<PrismaClient,'$transaction'>){
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
    async function read(kind:'BULLETIN'|'WORSHIP',page:number){
     let rows:WorshipManagementRow[];
     if(kind==='BULLETIN'){
     const values=await tx.bulletin.findMany({where:{deletedAt:null,worshipDate:range},orderBy:[{worshipDate:'desc'},{id:'desc'}],skip:page*30,take:31,select:{id:true,title:true,worshipDate:true,status:true,updatedAt:true,summary:true,worshipContentId:true,worshipContent:{select:{title:true,deletedAt:true}}}});
     rows=values.map(r=>({id:r.id,kind:'BULLETIN',title:r.title,date:r.worshipDate.toISOString().slice(0,10),status:r.status,updatedAt:r.updatedAt.toISOString(),summary:r.summary??'',worshipContentId:r.worshipContentId,linkedTitle:r.worshipContent&&!r.worshipContent.deletedAt?r.worshipContent.title:null,type:'주보',preacher:'',scripture:'',videoId:null}));
    }else{
     const values=await tx.worshipContent.findMany({where:{deletedAt:null,contentDate:range},orderBy:[{contentDate:'desc'},{id:'desc'}],skip:page*30,take:31,select:{id:true,title:true,type:true,contentDate:true,status:true,updatedAt:true,summary:true,preacher:true,scripture:true,youtubeVideoId:true}});
     rows=values.map(r=>({id:r.id,kind:'WORSHIP',title:r.title,date:r.contentDate.toISOString().slice(0,10),status:r.status,updatedAt:r.updatedAt.toISOString(),summary:r.summary??'',worshipContentId:null,linkedTitle:null,type:r.type,preacher:r.preacher??'',scripture:r.scripture??'',videoId:r.youtubeVideoId}));
    }
     return {data:rows.slice(0,30),nextPage:rows.length>30?page+1:null};
    }
    if(input.kind==='ALL'){const BULLETIN=await read('BULLETIN',input.bulletinPage);const WORSHIP=await read('WORSHIP',input.worshipPage);return {BULLETIN,WORSHIP};}
    return read(input.kind,input.page);
   });
  },
  async save(userId:string,raw:unknown){
   const input=bulletinManagementSave.parse(raw);
   return db.$transaction(async tx=>{
    const actor=await authorize(tx,userId);
    const current=await tx.bulletin.findFirst({where:{id:input.id,deletedAt:null}});
    if(!current)throw new ContentManagementError(404,'주보를 찾을 수 없습니다.');
    if(current.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new ContentManagementError(409,'다른 화면에서 수정되었습니다. 다시 열어 주세요.');
    if(input.worshipContentId!==null&&input.worshipContentId!==current.worshipContentId&&!await tx.worshipContent.findFirst({where:{id:input.worshipContentId,deletedAt:null},select:{id:true}}))throw new ContentManagementError(404,'연결할 말씀을 찾을 수 없습니다.');
    const result=await tx.bulletin.updateMany({where:{id:input.id,deletedAt:null,updatedAt:new Date(input.expectedUpdatedAt)},data:{title:input.title,worshipDate:new Date(`${input.worshipDate}T00:00:00.000Z`),summary:input.summary??null,worshipContentId:input.worshipContentId,status:input.status,publishedAt:input.status==='PUBLISHED'?current.publishedAt??new Date():null}});
    if(result.count!==1)throw new ContentManagementError(409,'다른 화면에서 수정되었습니다. 다시 열어 주세요.');
    await tx.activityLog.create({data:{actorId:actor.id,action:'UPDATE',entityType:'Bulletin',entityId:input.id,summary:'통합 예배 자료에서 주보 수정',changes:{previousStatus:current.status,nextStatus:input.status,previousWorshipContentId:current.worshipContentId,worshipContentId:input.worshipContentId}}});
    return {saved:true};
   });
  },
 };
}
