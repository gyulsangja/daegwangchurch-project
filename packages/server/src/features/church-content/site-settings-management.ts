import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {siteSettingsCommand,siteSettingFields} from '@daegwang/contracts/site-settings-management';
import {ContentManagementError} from './management';
const contactFields=['transitInfo','parkingInfo','privacyOfficer','privacyContact','offeringBank','offeringNumber','offeringHolder','offeringNote'] as const;
const contact=(v:Prisma.JsonValue|null)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
export function createSiteSettingsManagement(db:Pick<PrismaClient,'$transaction'>,canonicalUrl='https://daegwangchurch.kr'){
 async function authorize(tx:Prisma.TransactionClient,user:string){const actor=await tx.adminProfile.findUnique({where:{authUserId:user}});if(!actor?.isActive)throw new ContentManagementError(403,'홈페이지·앱 관리 권한이 필요합니다.');return actor;}
 return {
  async list(user:string){return db.$transaction(async tx=>{await authorize(tx,user);const row=await tx.siteSetting.findUnique({where:{singletonKey:'SITE'}});const data:Record<string,unknown>=row?{...row,...contact(row.contactOptions)}:{siteName:'대광교회',canonicalUrl};return {expectedUpdatedAt:row?.updatedAt.toISOString()??null,values:Object.fromEntries(siteSettingFields.map(k=>[k,data[k]===null||data[k]===undefined?'':String(data[k])]))};});},
  async save(user:string,raw:unknown){const input=siteSettingsCommand.parse(raw),d=input.values;return db.$transaction(async tx=>{
   const actor=await authorize(tx,user);await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('site-settings', 0))`;
   const old=await tx.siteSetting.findUnique({where:{singletonKey:'SITE'}});
   if((old?.updatedAt.toISOString()??null)!==input.expectedUpdatedAt)throw new ContentManagementError(409,'교회 기본 정보가 다른 화면에서 변경되었습니다. 새로고침 후 다시 확인해 주세요.');
   const contactOptions={...contact(old?.contactOptions??null),...Object.fromEntries(contactFields.map(k=>[k,d[k]??'']))} as Prisma.InputJsonObject;
   const data={siteName:d.siteName,description:d.description??null,canonicalUrl:d.canonicalUrl,address:d.address??null,addressDetail:d.addressDetail??null,phone:d.phone??null,email:d.email??null,mapLatitude:d.mapLatitude??null,mapLongitude:d.mapLongitude??null,youtubeUrl:d.youtubeUrl??null,contactOptions};
   const row=await tx.siteSetting.upsert({where:{singletonKey:'SITE'},create:{singletonKey:'SITE',...data},update:data});
   await tx.activityLog.create({data:{actorId:actor.id,action:'UPDATE',entityType:'SiteSetting',entityId:row.id,summary:'홈페이지·앱 교회 기본 정보 수정'}});
   return {saved:true,expectedUpdatedAt:row.updatedAt.toISOString()};
  });},
 };
}
