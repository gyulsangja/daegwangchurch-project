import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {bulletinManagementSave,worshipManagementQuery,worshipManagementPage} from '@daegwang/contracts/worship-management';
import {authenticatedSession} from './auth-security';
import {operationalEnabled} from './operational-config';
export async function manageWorship(actor:Actor,raw:unknown,save=false){
 if(!operationalEnabled()||actor.role!=='ADMIN')throw new DirectoryError('FORBIDDEN','현재 예배 자료 통합은 목회 최고관리자와 기존 CMS 관리자 권한이 필요합니다.');
 const input=save?bulletinManagementSave.parse(raw):worshipManagementQuery.parse(raw);
 const {client,user}=await authenticatedSession();const {data,error}=await client.auth.getSession();
 if(error||!data.session||data.session.user.id!==user.id||user.id!==actor.id)throw new Error('MINISTRY_LOGIN_REQUIRED');
 const endpoint='https://daegwangchurch-admin.vercel.app/api/manage/worship';
 const response=await fetch(save?endpoint:`${endpoint}?${new URLSearchParams(Object.entries(input).map(([k,v])=>[k,String(v)]))}`,{method:save?'POST':'GET',headers:{Authorization:`Bearer ${data.session.access_token}`,...(save?{'Content-Type':'application/json'}:{})},...(save?{body:JSON.stringify(raw)}:{}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok){
  if(response.status===401)throw new Error('MINISTRY_LOGIN_REQUIRED');
  if(response.status===403)throw new DirectoryError('FORBIDDEN','기존 CMS 관리 권한이 필요합니다.');
  if(response.status===409)throw new DirectoryError('CONFLICT','다른 화면에서 변경되었습니다. 다시 열어 주세요.');
  if(response.status===404)throw new DirectoryError('NOT_FOUND','자료를 찾을 수 없습니다.');
  throw new Error('CMS_UNAVAILABLE');
 }
 const result=await response.json();if(save){if(result.saved!==true)throw new Error('CMS_UNAVAILABLE');return {saved:true};}
 return worshipManagementPage.parse(result);
}
