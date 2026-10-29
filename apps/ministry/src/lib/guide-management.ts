import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {guideQuery,guideCommand,guidePage,guideDetail} from '@daegwang/contracts/guide-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageGuides(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||!['ADMIN','CONTENT'].includes(actor.role))throw new DirectoryError('FORBIDDEN','교회 안내 관리 권한이 필요합니다.');
 const input=save?guideCommand.parse(raw):guideQuery.parse(raw);
 if('operation'in input&&input.operation==='DELETE'&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','삭제 권한이 필요합니다.');
 const result=await requestCmsManagement(actor,'guides',input,save,session,raw);
 if('operation'in input){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};}
 return input.id?{data:guideDetail.parse(result.data)}:guidePage.parse(result);
}
