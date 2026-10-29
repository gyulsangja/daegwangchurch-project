import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {albumQuery,albumCommand,albumPage,albumDetail} from '@daegwang/contracts/album-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageAlbums(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','사진첩 관리 권한이 필요합니다.');
 const input=save?albumCommand.parse(raw):albumQuery.parse(raw);
 if('operation'in input&&input.operation==='DELETE'&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','삭제 권한이 필요합니다.');
 const result=await requestCmsManagement(actor,'albums',input,save,session,raw);
 if('operation'in input){if(result.saved!==true)throw Error('CMS_UNAVAILABLE');return {saved:true};}
 return input.id?{data:albumDetail.parse(result.data)}:albumPage.parse(result);
}
