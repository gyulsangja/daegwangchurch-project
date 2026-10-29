import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {contentQuery,contentMutation,contentPage,contentRow} from '@daegwang/contracts/church-content-management';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
import {operationalEnabled} from './operational-config';
export async function manageChurchContent(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||!['ADMIN','CONTENT'].includes(actor.role))throw new DirectoryError('FORBIDDEN','목회 콘텐츠 담당 권한과 기존 콘텐츠 관리 권한이 필요합니다.');
 const input=save?contentMutation.parse(raw):contentQuery.parse(raw);
 if('operation'in input&&!actor.canDelete)throw new DirectoryError('FORBIDDEN','게시물 삭제 권한이 필요합니다.');
 const json=await requestCmsManagement(actor,'church-content',input,save,session,raw);
 return save?{data:contentRow.parse(json.data)}:contentPage.parse(json);
}
