import 'server-only';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {memberAccountQuery,memberAccountCommand} from '@daegwang/contracts/member-account-management';
import {getMemberDirectory} from '../member/admin-directory';
import {createAdminMemberManagement,AdminMemberError} from '../member/admin-management';
import {reviewChurchMembership} from '../member/church-membership';
import {MemberRecordConflict,MemberRecordNotFound} from '../member/record-service';
import {ContentManagementError} from './management';
import type {DeletionProvider} from '../member/deletion-service';
export function createMemberAccountManagement(db:PrismaClient,options:{membershipEnabled:boolean;unifiedAccess?:boolean;provider?:Pick<DeletionProvider,'deleteIdentity'>}){
 async function authorize(tx:Pick<Prisma.TransactionClient,'adminProfile'>,userId:string){const actor=await tx.adminProfile.findUnique({where:{authUserId:userId}});if(!actor?.isActive||actor.role!=='SUPER_ADMIN')throw new ContentManagementError(403,'회원 관리에는 기존 최고관리자 권한이 필요합니다.');return actor;}
 return {
  async list(userId:string,raw:unknown){const input=memberAccountQuery.parse(raw);return db.$transaction(async tx=>{
   const actor=await authorize(tx,userId);const directory=await getMemberDirectory({...input,page:String(input.page)},tx);
   const groups=await tx.churchGroup.findMany({where:{isActive:true},select:{id:true,name:true},orderBy:{name:'asc'},take:200});
   const memberships=await tx.groupMembership.findMany({where:{ownerId:{in:directory.rows.map(r=>r.id)}},select:{ownerId:true,groupId:true}});
   return {...directory,rows:directory.rows.map(row=>({...row,createdAt:row.createdAt.toISOString(),lastSignInAt:row.lastSignInAt?.toISOString()??null,groupIds:memberships.filter(m=>m.ownerId===row.id).map(m=>m.groupId)})),groups,actorId:actor.authUserId,deletionReady:!!options.provider,membershipEnabled:options.membershipEnabled};
  });},
  async save(userId:string,raw:unknown){const input=memberAccountCommand.parse(raw);const actor=await authorize(db,userId);const service=createAdminMemberManagement(db,options.provider);
   try{
    if(input.operation==='REVIEW'){if(!options.membershipEnabled)throw new ContentManagementError(409,'교인 확인 기능이 활성화되지 않았습니다.');await reviewChurchMembership(db,actor.id,{ownerId:input.ownerId,version:input.version,status:input.status,groupIds:input.groupIds});}
    else if(input.operation==='DETAILS')await service.churchDetails(actor.id,input);
    else if(input.operation==='ROLE'){if(options.unifiedAccess)throw new ContentManagementError(409,'사용자 및 권한에서 목회·콘텐츠 권한을 함께 변경해 주세요.');await service.role(actor.id,input);}
    else {const result=await service.remove(actor.id,input);return {saved:true,completed:result.completed};}
    return {saved:true};
   }catch(e){if(e instanceof AdminMemberError)throw new ContentManagementError(409,e.message);if(e instanceof MemberRecordConflict)throw new ContentManagementError(409,'회원 정보가 변경되었습니다. 새로고침해 주세요.');if(e instanceof MemberRecordNotFound)throw new ContentManagementError(404,'회원 정보를 찾을 수 없습니다.');throw e;}
  },
 };
}
