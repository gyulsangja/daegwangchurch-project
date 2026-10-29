import 'server-only';
import {randomUUID} from 'node:crypto';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import type {MinistryYear} from '@daegwang/ministry-core/years';
import {organizationGroupChanges,mapOrganizationGroup} from '@daegwang/ministry-core/organization-sync';
import {organizationSyncQuery,organizationSyncCommand,organizationSyncPreview} from '@daegwang/contracts/organization-sync';
import {managedGroupPage,managedGroupMembers} from '@daegwang/contracts/group-management';
import {ministryTransaction} from '@daegwang/database/ministry-postgres';
import {readOrganizationSyncSource,writeOrganizationGroupMapping} from '@daegwang/database/ministry-organization-sync';
import {ministryPool} from './operational-directory';
import {operationalEnabled} from './operational-config';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
export async function organizationSync(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN'||!session)throw new DirectoryError('FORBIDDEN');
 const input=save?organizationSyncCommand.parse(raw):{operation:'PREVIEW' as const,...organizationSyncQuery.parse(raw)};
 const groups=managedGroupPage.parse(await requestCmsManagement(actor,'groups',{view:'GROUPS',groupId:input.groupId},false,session));
 if(!groups.superAdmin||!groups.groups.some(g=>g.id===input.groupId&&g.isActive))throw new DirectoryError('FORBIDDEN','활성 모임의 최고관리자 권한이 필요합니다.');
 const accountList=async()=>managedGroupMembers.parse(await requestCmsManagement(actor,'groups',{view:'MEMBERS',groupId:input.groupId},false,session));
 // Annual mutations and account-link changes use the same church lock. External writes may
 // succeed before a network failure; re-preview resolves that outcome without duplicating rows.
 return ministryTransaction(ministryPool(),actor.id,actor.churchId,async(db,grant)=>{
  const source=await readOrganizationSyncSource<MinistryYear>(db,grant),period=source.period;
  if(input.operation!=='PREVIEW'&&(input.year!==period.year||input.version!==period.version))throw new DirectoryError('CONFLICT','운영 연도나 조직 편성이 변경되었습니다. 다시 불러와 주세요.');
  if(input.operation!=='PREVIEW'&&input.operation==='MAP'){
   const next=mapOrganizationGroup(period,input.groupId,input.organizationIds,input.version,actor.id,new Date().toISOString());await writeOrganizationGroupMapping(db,grant,next,period.version);
  }else{
   const accounts=await accountList();const plan=organizationGroupChanges(period,source.links,accounts.members,input.groupId);
   if(input.operation==='PREVIEW')return organizationSyncPreview.parse({year:period.year,version:period.version,organizations:period.organizations.map(o=>({id:o.id,name:o.name,appGroupId:o.appGroupId})),...plan,limited:accounts.limited});
   if(accounts.limited)throw new DirectoryError('INVALID','전체 회원을 확인할 수 없어 자동 비교 적용을 중단했습니다. 앱 회원 관리에서 개별 변경해 주세요.');
   if(input.changes.some(c=>!plan.changes.some(p=>p.ownerId===c.ownerId&&p.expectedMember===c.expectedMember&&p.approved===c.approved)))throw new DirectoryError('CONFLICT','교적 연결이나 앱 소속이 바뀌었습니다. 다시 비교해 주세요.');
   const body={operation:'MEMBERS',groupId:input.groupId,changes:input.changes,confirmed:true};const result=await requestCmsManagement(actor,'groups',body,true,session,body);if(result.saved!==true)throw Error('CMS_UNAVAILABLE');
  }
  const id=randomUUID();await db.query('INSERT INTO ministry.audits(church_id,id,payload) VALUES($1,$2,$3::jsonb)',[actor.churchId,id,JSON.stringify({id,churchId:actor.churchId,actorId:actor.id,memberId:'',action:'UPDATE',entityType:'APP_GROUP',entityId:input.groupId,fields:[input.operation],at:new Date().toISOString()})]);return {saved:true};
 },{aal:session.aal,enforceMfa:false,readOnly:!save});
}
