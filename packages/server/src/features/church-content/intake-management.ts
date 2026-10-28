import type {Prisma,PrismaClient,Inquiry,MemberCareRequest} from '@daegwang/database/generated/client';
import {intakeQuery,intakeSave,type IntakeRow} from '@daegwang/contracts/intake-management';
import {inquiryStatusSchema} from '@daegwang/contracts/features/inquiries/schema';
import {careStatusSchema,careInputSchema} from '@daegwang/contracts/features/member/extras';
import {careAllowedTransitions,carePolicySchema} from '../member/care-service';
import {ContentManagementError} from './management';
function inquiryDto(r:Pick<Inquiry,'id'|'name'|'title'|'type'|'status'|'createdAt'|'updatedAt'>):IntakeRow{return {id:r.id,kind:'INQUIRY',name:r.name,title:r.title??'',type:r.type,status:r.status,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString(),version:null};}
function careDto(r:Pick<MemberCareRequest,'id'|'content'|'status'|'createdAt'|'updatedAt'|'version'>):IntakeRow{const content=careInputSchema.parse(r.content);return {id:r.id,kind:'CARE',name:content.name,title:content.kind==='VISIT'?'심방 요청':'상담 요청',type:content.kind,status:r.status,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString(),version:r.version};}
export function createIntakeManagement(db:Pick<PrismaClient,'$transaction'>,now=()=>new Date()){
 async function authorize(tx:Prisma.TransactionClient,userId:string,kind:'INQUIRY'|'CARE'){
  const admin=await tx.adminProfile.findUnique({where:{authUserId:userId}});
  if(!admin?.isActive||!['ADMIN','SUPER_ADMIN'].includes(admin.role))throw new ContentManagementError(403,'접수 관리 권한이 필요합니다.');
  if(kind==='INQUIRY'&&admin.role!=='SUPER_ADMIN')throw new ContentManagementError(403,'홈페이지 문의 담당 권한이 필요합니다.');
  if(kind==='CARE'){const settings=await tx.careSetting.findUnique({where:{id:'CARE'}});const policy=carePolicySchema.safeParse(settings?.policy);if(!policy.success||!policy.data.adminIds.includes(admin.id))throw new ContentManagementError(403,'상담·심방 열람 담당자로 지정되어야 합니다.');}
  return admin;
 }
 return {
  async list(userId:string,raw:unknown){const input=intakeQuery.parse(raw);return db.$transaction(async tx=>{
   await authorize(tx,userId,input.kind);
   if(input.kind==='INQUIRY'){
    if(input.id){const r=await tx.inquiry.findFirst({where:{id:input.id,deletedAt:null},include:{notes:{orderBy:[{createdAt:'desc'},{id:'desc'}],take:51,include:{author:{select:{displayName:true}}}}}});if(!r)throw new ContentManagementError(404,'문의를 찾을 수 없습니다.');return {data:{...inquiryDto(r),phone:r.phone??'',email:r.email??'',preferredContact:r.preferredContact??'',content:r.content,notes:r.notes.slice(0,50).map(n=>({id:n.id,body:n.content,author:n.author.displayName,createdAt:n.createdAt.toISOString()})),notesLimited:r.notes.length>50}};}
    const status=input.status?inquiryStatusSchema.parse(input.status):undefined;
    const rows=await tx.inquiry.findMany({where:{deletedAt:null,...(status?{status}:{})},select:{id:true,name:true,title:true,type:true,status:true,createdAt:true,updatedAt:true},orderBy:[{createdAt:'desc'},{id:'desc'}],skip:input.page*30,take:31});return {data:rows.slice(0,30).map(inquiryDto),nextPage:rows.length>30?input.page+1:null};
   }
   if(input.id){const r=await tx.memberCareRequest.findFirst({where:{id:input.id,expiresAt:{gt:now()}}});if(!r)throw new ContentManagementError(404,'요청을 찾을 수 없거나 보관 기간이 끝났습니다.');const c=careInputSchema.parse(r.content);return {data:{...careDto(r),phone:c.phone,email:'',preferredContact:c.preferredTime,content:c.message+(c.kind==='VISIT'?`\n방문 장소: ${c.place}\n${c.location}`:`\n상담 방식: ${c.method}`),notes:[],notesLimited:false}};}
   const status=input.status?careStatusSchema.parse(input.status):undefined;
   const rows=await tx.memberCareRequest.findMany({where:{expiresAt:{gt:now()},...(status?{status}:{})},select:{id:true,content:true,status:true,createdAt:true,updatedAt:true,version:true},orderBy:[{createdAt:'desc'},{id:'desc'}],skip:input.page*30,take:31});return {data:rows.slice(0,30).map(careDto),nextPage:rows.length>30?input.page+1:null};
  });},
  async save(userId:string,raw:unknown){const input=intakeSave.parse(raw);return db.$transaction(async tx=>{
   const actor=await authorize(tx,userId,input.kind);
   if(input.kind==='INQUIRY'){
    const current=await tx.inquiry.findFirst({where:{id:input.id,deletedAt:null}});if(!current)throw new ContentManagementError(404,'문의를 찾을 수 없습니다.');
    if((await tx.inquiry.updateMany({where:{id:input.id,deletedAt:null,updatedAt:new Date(input.expectedUpdatedAt)},data:{status:input.status,checkedAt:current.checkedAt??now(),completedAt:input.status==='COMPLETED'?current.completedAt??now():null}})).count!==1)throw new ContentManagementError(409,'문의가 변경되었습니다. 다시 열어 주세요.');
    if(input.note)await tx.inquiryNote.create({data:{inquiryId:input.id,authorId:actor.id,content:input.note}});
    await tx.activityLog.create({data:{actorId:actor.id,action:'UPDATE',entityType:'Inquiry',entityId:input.id,summary:'통합 접수함에서 처리 상태·내부 메모 저장',changes:{previous:current.status,next:input.status,noteAdded:!!input.note}}});
   }else{
    const current=await tx.memberCareRequest.findFirst({where:{id:input.id,expiresAt:{gt:now()}}});if(!current)throw new ContentManagementError(404,'요청을 찾을 수 없거나 보관 기간이 끝났습니다.');
    if(!careAllowedTransitions[current.status]?.includes(input.status))throw new ContentManagementError(409,'변경할 수 없는 상태입니다. 다시 확인해 주세요.');
    if((await tx.memberCareRequest.updateMany({where:{id:input.id,version:input.version,status:current.status,expiresAt:{gt:now()}},data:{status:input.status,version:{increment:1}}})).count!==1)throw new ContentManagementError(409,'요청이 변경되었습니다. 다시 열어 주세요.');
    await tx.activityLog.create({data:{actorId:actor.id,action:'UPDATE',entityType:'MemberCareRequest',entityId:input.id,summary:'통합 접수함에서 돌봄 요청 상태 변경',changes:{previous:current.status,next:input.status}}});
   }
   return {saved:true};
  });},
 };
}
