import {randomUUID} from 'node:crypto';
import type {PrismaClient} from '@daegwang/database/generated/client';
import {careSettingsInput} from '@daegwang/contracts/operations-settings';
import {careSettingsSchema,saveCareSettings} from '../member/care-settings';
import {ContentManagementError} from './management';
export function createOperationsSettings(db:PrismaClient,env:NodeJS.ProcessEnv=process.env){
 async function actor(user:string){const admin=await db.adminProfile.findUnique({where:{authUserId:user}});if(!admin?.isActive||admin.role!=='SUPER_ADMIN')throw new ContentManagementError(403,'운영 정책 설정 권한이 필요합니다.');return admin;}
 return {
  async list(user:string){await actor(user);const row=await db.careSetting.findUnique({where:{id:'CARE'}});let value=row?careSettingsSchema.parse(row):null;
   if(!value){const parsed=careSettingsSchema.safeParse({enabled:env.APP_MEMBER_CARE_ENABLED==='true',policy:(()=>{try{return JSON.parse(env.APP_MEMBER_CARE_POLICY??'');}catch{return null;}})()});if(parsed.success)value=parsed.data;}
   const admins=await db.adminProfile.findMany({where:{OR:[{isActive:true},{id:{in:value?.policy.adminIds??[]}}]},select:{id:true,displayName:true,isActive:true},orderBy:{displayName:'asc'}});
   return {expectedVersion:row?careSettingsSchema.parse(row).policy.version:null,enabled:value?.enabled??false,adminIds:value?.policy.adminIds??[],retentionUnit:value?.policy.retentionYears?'years' as const:value?'days' as const:'years' as const,retention:value?.policy.retentionYears??value?.policy.retentionDays??5,notice:value?.policy.notice??'상담·심방을 위해 이름, 연락처, 희망 시간과 요청 내용을 지정된 교회 담당자에게 전달합니다.',admins:admins.map(a=>({id:a.id,name:a.displayName,active:a.isActive}))};
  },
  async save(user:string,raw:unknown){const input=careSettingsInput.parse(raw);const admin=await actor(user);await saveCareSettings(db,admin.id,{enabled:input.enabled,policy:{version:randomUUID(),notice:input.notice,adminIds:input.adminIds,retentionDays:input.retention*(input.retentionUnit==='years'?365:1),...(input.retentionUnit==='years'?{retentionYears:input.retention}:{})}},input.expectedVersion);return {saved:true};},
 };
}
