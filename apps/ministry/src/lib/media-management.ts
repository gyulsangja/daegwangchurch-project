import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {mediaQuery,mediaCommand,mediaPage,managedMedia} from '@daegwang/contracts/media-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageMedia(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||!['ADMIN','CONTENT'].includes(actor.role))throw new DirectoryError('FORBIDDEN','공개 콘텐츠 관리 권한이 필요합니다.');
 const input=save?mediaCommand.parse(raw):mediaQuery.parse(raw);
 const json=await requestCmsManagement(actor,'media',input,save,session,raw);
 if(!save)return mediaPage.parse(json);
 if('operation'in input&&['COMPLETE_IMAGE','COMPLETE_DOCUMENT'].includes(input.operation))return {data:managedMedia.parse(json.data)};
 // Signed storage URL is server-generated and never accepts a client destination.
 if(typeof json.uploadUrl!=='string'||typeof json.receipt!=='string')throw Error('INVALID_UPLOAD_RESPONSE');return {uploadUrl:json.uploadUrl,receipt:json.receipt};
}
