import {randomUUID} from 'node:crypto';
import type {Album,Media,Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {albumQuery,albumCommand} from '@daegwang/contracts/album-management';
import {createContentSlug} from '@daegwang/contracts/content-slug';
import {ContentManagementError} from './management';
import {mediaDto,selectableMedia} from '../media/management';
export function createAlbumManagement(db:Pick<PrismaClient,'$transaction'>,url:string){
 async function admin(tx:Prisma.TransactionClient,user:string){const actor=await tx.adminProfile.findUnique({where:{authUserId:user}});if(!actor?.isActive||!['ADMIN','SUPER_ADMIN'].includes(actor.role))throw new ContentManagementError(403,'공개 사진첩 관리 권한이 필요합니다.');return actor;}
 const summary=(row:Omit<Album,'description'>&{coverImage:Media|null;_count:{images:number}})=>({id:row.id,title:row.title,category:row.category,eventDate:row.eventDate.toISOString().slice(0,10),status:row.status,showOnMain:row.showOnMain,updatedAt:row.updatedAt.toISOString(),imageCount:row._count.images,coverImage:row.coverImage&&!row.coverImage.deletedAt&&row.coverImage.visibility==='PUBLIC'?mediaDto(row.coverImage,url):null});
 return {
  async list(user:string,raw:unknown){const input=albumQuery.parse(raw);return db.$transaction(async tx=>{
   await admin(tx,user);
   if(input.id){const row=await tx.album.findFirst({where:{id:input.id,deletedAt:null},include:{coverImage:true,_count:{select:{images:true}},images:{where:{media:selectableMedia},include:{media:true},orderBy:{sortOrder:'asc'}}}});if(!row)throw new ContentManagementError(404,'사진첩을 찾을 수 없습니다.');return {data:{...summary(row),description:row.description??'',images:row.images.map(i=>({media:mediaDto(i.media,url),caption:i.caption??''}))}};}
   const rows=await tx.album.findMany({where:{deletedAt:null,...(input.q?{title:{contains:input.q,mode:'insensitive'}}:{})},omit:{description:true},include:{coverImage:true,_count:{select:{images:true}}},orderBy:[{eventDate:'desc'},{id:'desc'}],skip:input.page*20,take:21});return {data:rows.slice(0,20).map(summary),nextPage:rows.length>20?input.page+1:null};
  });},
  async save(user:string,raw:unknown){const input=albumCommand.parse(raw);return db.$transaction(async tx=>{
   const actor=await admin(tx,user);const current=await tx.album.findUnique({where:{id:input.id}});
   if(input.expectedUpdatedAt===null?!!current:!current||!!current.deletedAt||current.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new ContentManagementError(409,'다른 화면에서 수정되었거나 이미 저장되었습니다. 다시 열어 주세요.');
   if(input.operation==='DELETE'){
    if((await tx.album.updateMany({where:{id:input.id,updatedAt:new Date(input.expectedUpdatedAt),deletedAt:null},data:{deletedAt:new Date()}})).count!==1)throw new ContentManagementError(409,'사진첩이 변경되었습니다. 다시 열어 주세요.');
   }else{
    const ids=input.images.map(i=>i.mediaId);const available=await tx.media.findMany({where:{...selectableMedia,id:{in:ids},mimeType:{in:['image/jpeg','image/png','image/webp']}},select:{id:true}});
    if(available.length!==ids.length)throw new ContentManagementError(409,'사진이 변경되었거나 업로드 확인이 끝나지 않았습니다.');
    const data={...input.data,description:input.data.description??null,eventDate:new Date(input.data.eventDate+'T00:00:00Z'),coverImageId:input.coverImageId,publishedAt:input.data.status==='PUBLISHED'?current?.publishedAt??new Date():null};
    if(current){if((await tx.album.updateMany({where:{id:input.id,updatedAt:current.updatedAt,deletedAt:null},data})).count!==1)throw new ContentManagementError(409,'사진첩이 변경되었습니다. 다시 열어 주세요.');}
    else await tx.album.create({data:{...data,id:input.id,slug:createContentSlug(input.data.title,'album',randomUUID())}});
    await tx.albumImage.deleteMany({where:{albumId:input.id,mediaId:{notIn:ids}}});
    for(const [sortOrder,image] of input.images.entries())await tx.albumImage.upsert({where:{albumId_mediaId:{albumId:input.id,mediaId:image.mediaId}},create:{albumId:input.id,mediaId:image.mediaId,caption:image.caption||null,sortOrder},update:{caption:image.caption||null,sortOrder}});
   }
   await tx.activityLog.create({data:{actorId:actor.id,action:input.operation==='DELETE'?'DELETE':current?'UPDATE':'CREATE',entityType:'Album',entityId:input.id,summary:'통합 관리 사진첩 저장',changes:{operation:input.operation}}});return {saved:true};
  });},
 };
}
