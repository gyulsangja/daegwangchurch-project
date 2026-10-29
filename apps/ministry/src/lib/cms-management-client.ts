import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {authenticatedSession} from './auth-security';
export type VerifiedSession=Awaited<ReturnType<typeof authenticatedSession>>|null;
// Fixed destinations only. A verified session is reused within one request, never globally cached.
export async function requestCmsManagement(actor:Actor,resource:'worship'|'church-content'|'intake'|'member-accounts'|'groups'|'site-settings',input:object,save:boolean,session?:VerifiedSession,rawBody?:unknown){
 const {client,user}=session??await authenticatedSession();
 const {data,error}=await client.auth.getSession();
 if(error||!data.session||data.session.user.id!==user.id||user.id!==actor.id)throw new Error('MINISTRY_LOGIN_REQUIRED');
 const endpoint=`https://daegwangchurch-admin.vercel.app/api/manage/${resource}`;
 const response=await fetch(save?endpoint:`${endpoint}?${new URLSearchParams(Object.entries(input).map(([k,v])=>[k,String(v)]))}`,{
  method:save?'POST':'GET',headers:{Authorization:`Bearer ${data.session.access_token}`,...(save?{'Content-Type':'application/json'}:{})},
  // Keep empty form strings: schema transforms map them to undefined, but the receiving server validates the original input contract again.
  ...(save?{body:JSON.stringify(rawBody)}:{}),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000),
 });
 if(!response.ok){
  if(response.status===401)throw new Error('MINISTRY_LOGIN_REQUIRED');
  if(response.status===403)throw new DirectoryError('FORBIDDEN','기존 홈페이지·앱 콘텐츠 관리 권한도 필요합니다.');
  if(response.status===409)throw new DirectoryError('CONFLICT','이미 저장되었거나 다른 담당자가 수정했습니다. 목록을 다시 불러와 확인해 주세요.');
  if(response.status===404)throw new DirectoryError('NOT_FOUND','자료를 찾을 수 없습니다.');
  if(response.status===422)throw new DirectoryError('INVALID','제목·본문·날짜와 공개 설정을 확인해 주세요.');
  throw new Error('CMS_UNAVAILABLE');
 }
 return response.json();
}
