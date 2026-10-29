import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {worshipManagementSave,worshipManagementQuery,worshipManagementResult} from '@daegwang/contracts/worship-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
import {prepareBulletinPdf,bulletinPdfSave,bulletinUploadGrant} from '@daegwang/contracts/bulletin-upload';
export async function manageWorship(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||!['ADMIN','CONTENT'].includes(actor.role))throw new DirectoryError('FORBIDDEN','예배 자료 관리 권한이 필요합니다.');
 if(save&&raw&&typeof raw==='object'&&'operation'in raw&&['PREPARE_PDF','SAVE_PDF'].includes(String(raw.operation))){
  const prepared=raw.operation==='PREPARE_PDF';const input=prepared?prepareBulletinPdf.parse(raw):bulletinPdfSave.parse(raw);
  const result=await requestCmsManagement(actor,'worship',input,true,session,raw);if(prepared)return bulletinUploadGrant.parse(result);if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};
 }
 const input=save?worshipManagementSave.parse(raw):worshipManagementQuery.parse(raw);
 if(save&&'operation'in input&&input.operation==='DELETE_SOURCE'&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','자료 삭제 권한이 필요합니다.');
 const result=await requestCmsManagement(actor,'worship',input,save,session,raw);if(save){if(result.saved!==true)throw new Error('CMS_UNAVAILABLE');return {saved:true};}
 return worshipManagementResult.parse(result);
}
