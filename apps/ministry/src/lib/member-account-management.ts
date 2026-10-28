import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {memberAccountQuery,memberAccountCommand,memberAccountPage} from '@daegwang/contracts/member-account-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageMemberAccounts(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','회원 관리 권한이 필요합니다.');
 const input=save?memberAccountCommand.parse(raw):memberAccountQuery.parse(raw);
 if('operation'in input&&input.operation==='DELETE'&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','회원 삭제 권한이 필요합니다.');
 const result=await requestCmsManagement(actor,'member-accounts',input,save,session,raw);
 if(save){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true,...(typeof result.completed==='boolean'?{completed:result.completed}:{})};}
 return memberAccountPage.parse(result);
}
