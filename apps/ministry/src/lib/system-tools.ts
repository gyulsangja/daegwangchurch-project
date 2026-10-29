import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {systemToolsQuery,systemToolsCommand,systemToolsPage} from '@daegwang/contracts/system-tools';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageSystemTools(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN'||save&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','운영 도구 관리 권한이 필요합니다.');
 const input=save?systemToolsCommand.parse(raw):systemToolsQuery.parse(raw);const result=await requestCmsManagement(actor,'system-tools',input,save,session,raw);if(!save)return systemToolsPage.parse(result);if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true,count:result.count,storageFailures:result.storageFailures};
}
