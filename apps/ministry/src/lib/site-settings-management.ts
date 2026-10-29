import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {siteSettingsCommand,siteSettingsPage} from '@daegwang/contracts/site-settings-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageSiteSettings(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||!['ADMIN','CONTENT'].includes(actor.role))throw new DirectoryError('FORBIDDEN','교회 기본 정보 관리 권한이 필요합니다.');
 const input=save?siteSettingsCommand.parse(raw):{};const result=await requestCmsManagement(actor,'site-settings',input,save,session,raw);
 if(save){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true,expectedUpdatedAt:result.expectedUpdatedAt};}return siteSettingsPage.parse(result);
}
