import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {careSettingsInput,careSettingsSnapshot} from '@daegwang/contracts/operations-settings';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageOperationsSettings(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','운영 정책 설정 권한이 필요합니다.');
 const input=save?careSettingsInput.parse(raw):{};const result=await requestCmsManagement(actor,'operations-settings',input,save,session,raw);
 if(save){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};}return careSettingsSnapshot.parse(result);
}
