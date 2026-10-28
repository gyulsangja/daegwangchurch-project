import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {groupManagementQuery,groupManagementCommand,managedGroupPage,managedNoticePage,managedNoticeDetail,managedGroupMembers,managedGroupManagers} from '@daegwang/contracts/group-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageGroups(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','모임 관리 권한이 필요합니다.');
 const input=save?groupManagementCommand.parse(raw):groupManagementQuery.parse(raw);
 if('operation'in input&&input.operation==='DELETE_NOTICE'&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','삭제 권한이 필요합니다.');
 const result=await requestCmsManagement(actor,'groups',input,save,session,raw);
 if('operation'in input){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};}
 return (input.view==='GROUPS'?managedGroupPage:input.view==='NOTICES'?managedNoticePage:input.view==='NOTICE_DETAIL'?managedNoticeDetail:input.view==='MEMBERS'?managedGroupMembers:managedGroupManagers).parse(result);
}
