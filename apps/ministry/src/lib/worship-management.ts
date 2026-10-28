import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {bulletinManagementSave,worshipManagementQuery,worshipManagementResult} from '@daegwang/contracts/worship-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageWorship(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','현재 예배 자료 통합은 목회 최고관리자와 기존 CMS 관리자 권한이 필요합니다.');
 const input=save?bulletinManagementSave.parse(raw):worshipManagementQuery.parse(raw);
 const result=await requestCmsManagement(actor,'worship',input,save,session,raw);if(save){if(result.saved!==true)throw new Error('CMS_UNAVAILABLE');return {saved:true};}
 return worshipManagementResult.parse(result);
}
