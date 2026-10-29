import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {groupManagementQuery,groupManagementCommand} from '@daegwang/contracts/group-management';
import {createGroupAdminService} from '../member/group-service';
import {MemberRecordConflict,MemberRecordNotFound} from '../member/record-service';
import {ContentManagementError} from './management';
const noticeSelect={id:true,groupId:true,title:true,audience:true,status:true,version:true,updatedAt:true} as const;
export function createGroupManagement(db:PrismaClient,enabled:boolean){
 async function authorize(tx:Pick<Prisma.TransactionClient,'adminProfile'|'groupManager'>,user:string,groupId?:string,superOnly=false){
  const actor=await tx.adminProfile.findUnique({where:{authUserId:user}});
  if(!actor?.isActive||superOnly&&actor.role!=='SUPER_ADMIN')throw new ContentManagementError(403,'모임 관리 권한이 필요합니다.');
  if(groupId&&actor.role!=='SUPER_ADMIN'&&!await tx.groupManager.findUnique({where:{groupId_adminId:{groupId,adminId:actor.id}}}))throw new ContentManagementError(403,'담당 모임만 관리할 수 있습니다.');
  return actor;
 }
 return {
  async list(user:string,raw:unknown){const input=groupManagementQuery.parse(raw);return db.$transaction(async tx=>{
   const actor=await authorize(tx,user,input.groupId,['MEMBERS','MANAGERS'].includes(input.view));
   const superAdmin=actor.role==='SUPER_ADMIN';const scope=superAdmin?{}:{managers:{some:{adminId:actor.id}}};
   if(input.view==='GROUPS'){
    const rows=await tx.churchGroup.findMany({where:{...scope,id:input.groupId},orderBy:[{name:'asc'},{id:'asc'}],take:31,skip:input.page*30,include:{_count:{select:{memberships:true}}}});
    return {groups:rows.slice(0,30).map(r=>({id:r.id,name:r.name,description:r.description,isActive:r.isActive,version:r.version,memberCount:r._count.memberships})),nextPage:rows.length>30?input.page+1:null,superAdmin,enabled};
   }
   if(input.view==='NOTICES'){
    const rows=await tx.groupNotice.findMany({where:{deletedAt:null,groupId:input.groupId,group:scope},select:noticeSelect,orderBy:[{updatedAt:'desc'},{id:'desc'}],take:21,skip:input.page*20});
    return {data:rows.slice(0,20).map(r=>({...r,updatedAt:r.updatedAt.toISOString()})),nextPage:rows.length>20?input.page+1:null};
   }
   if(input.view==='NOTICE_DETAIL'){const row=await tx.groupNotice.findFirst({where:{id:input.id,groupId:input.groupId,deletedAt:null,group:scope},select:{...noticeSelect,body:true}});if(!row)throw new ContentManagementError(404,'공지를 찾을 수 없습니다.');return {notice:{...row,updatedAt:row.updatedAt.toISOString()}};}
   if(input.view==='MANAGERS'){
    const assigned=await tx.groupManager.findMany({where:{groupId:input.groupId},select:{adminId:true}});
    const admins=await tx.adminProfile.findMany({where:{OR:[{isActive:true},{id:{in:assigned.map(a=>a.adminId)}}]},select:{id:true,displayName:true},orderBy:{displayName:'asc'}});
    return {admins:admins.map(a=>({id:a.id,name:a.displayName,assigned:assigned.some(r=>r.adminId===a.id)}))};
   }
   const current=await tx.groupMembership.findMany({where:{groupId:input.groupId},select:{ownerId:true}});
   const profiles=await tx.memberProfile.findMany({where:{OR:[{churchMembership:{status:'CONFIRMED'}},{ownerId:{in:current.map(m=>m.ownerId)}}]},select:{ownerId:true,displayName:true,churchMembership:{select:{realName:true,status:true}}},orderBy:{ownerId:'asc'},take:501});
   const deleting=await tx.memberDeletion.findMany({where:{ownerId:{in:profiles.map(p=>p.ownerId)}},select:{ownerId:true}});
   return {members:profiles.slice(0,500).map(p=>({ownerId:p.ownerId,name:p.churchMembership?.realName||p.displayName||'이름 미입력',approved:current.some(m=>m.ownerId===p.ownerId),eligible:p.churchMembership?.status==='CONFIRMED'&&!deleting.some(d=>d.ownerId===p.ownerId)})),limited:profiles.length>500};
  });},
  async save(user:string,raw:unknown){const input=groupManagementCommand.parse(raw);const actor=await authorize(db,user,'groupId'in input?input.groupId:input.operation==='SAVE_NOTICE'?input.data.groupId:undefined, ['SAVE_GROUP','MEMBERS','MANAGER'].includes(input.operation));const service=createGroupAdminService(db,actor.id);
   try{
    if(input.operation==='SAVE_GROUP')await service.saveGroup(input.data);
    else if(input.operation==='SAVE_NOTICE')await service.saveNotice(input.data,input.version===null?undefined:input.id,input.version??undefined,input.version===null?input.id:undefined);
    else if(input.operation==='MEMBERS')await service.setMembershipBatch(input.groupId,input.changes);
    else if(input.operation==='MANAGER')await service.setManager(input.groupId,input.adminId,input.assigned,input.expectedAssigned);
    else await service.deleteNotice(input.groupId,input.id,input.version);
    return {saved:true};
   }catch(e){if(e instanceof MemberRecordConflict)throw new ContentManagementError(409,'소속·승인·공지 정보가 변경되었습니다. 다시 불러온 후 확인해 주세요.');if(e instanceof MemberRecordNotFound)throw new ContentManagementError(404,'모임이나 자료를 찾을 수 없습니다.');if(e instanceof Error&&e.message==='FORBIDDEN')throw new ContentManagementError(403,'모임 관리 권한이 필요합니다.');throw e;}
  },
 };
}
