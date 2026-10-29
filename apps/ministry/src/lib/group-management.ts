import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {groupManagementQuery,groupManagementCommand,managedGroupPage,managedNoticePage,managedNoticeDetail,managedGroupMembers,managedGroupManagers} from '@daegwang/contracts/group-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageGroups(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||!['ADMIN','CONTENT'].includes(actor.role))throw new DirectoryError('FORBIDDEN','모임 관리 권한이 필요합니다.');
 const input=save?groupManagementCommand.parse(raw):groupManagementQuery.parse(raw);
 if(actor.role==='CONTENT'&&('operation'in input?!['SAVE_NOTICE','DELETE_NOTICE'].includes(input.operation):!['GROUPS','NOTICES','NOTICE_DETAIL'].includes(input.view)))throw new DirectoryError('FORBIDDEN','콘텐츠 담당자는 배정된 모임 소식만 관리할 수 있습니다.');
 if('operation'in input&&input.operation==='DELETE_NOTICE'&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','삭제 권한이 필요합니다.');
 const result=await requestCmsManagement(actor,'groups',input,save,session,raw);
 if(actor.role==='CONTENT'&&'view'in input&&input.view==='GROUPS')result.superAdmin=false;
 if('operation'in input){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};}
 return (input.view==='GROUPS'?managedGroupPage:input.view==='NOTICES'?managedNoticePage:input.view==='NOTICE_DETAIL'?managedNoticeDetail:input.view==='MEMBERS'?managedGroupMembers:managedGroupManagers).parse(result);
}
