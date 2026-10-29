import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {fixedPageQuery,fixedPageCommand,fixedPageResult} from '@daegwang/contracts/page-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function managePages(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','홈페이지 안내 관리 권한이 필요합니다.');
 const input=save?fixedPageCommand.parse(raw):fixedPageQuery.parse(raw);const result=await requestCmsManagement(actor,'pages',input,save,session,raw);
 if(save){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true,expectedUpdatedAt:result.expectedUpdatedAt};}return fixedPageResult.parse(result);
}
