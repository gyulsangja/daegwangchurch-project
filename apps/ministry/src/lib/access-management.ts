import 'server-only';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {ministryPool} from './operational-directory';
import {operationalOrigin} from './operational-config';
import {accessChange,type AccessSnapshot} from '@daegwang/contracts/ministry-access';
export const accessEnabled=()=>process.env.MINISTRY_ACCESS_ENABLED==='true';
export const invitationHash=(value:string)=>createHash('sha256').update(value).digest('hex');
// Calls only narrowly scoped SQL functions; never use the migration owner's connection at runtime.
export async function accessQuery<T>(userId:string|null,aal:string,query:string,args:unknown[]=[],reauthenticated=false):Promise<T>{
 if(!accessEnabled()||!process.env.MINISTRY_CHURCH_ID)throw new Error('ACCESS_SETUP');
 const db=await ministryPool().connect();
 try{await db.query('BEGIN');const role=await db.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');if(role.rows[0]?.rolsuper||role.rows[0]?.rolbypassrls)throw new Error('ACCESS_FORBIDDEN');await db.query("SELECT set_config('ministry.user_id',$1,true),set_config('ministry.church_id',$2,true),set_config('ministry.aal',$3,true),set_config('ministry.reauthenticated',$4,true),set_config('statement_timeout','10000',true)",[userId??'',process.env.MINISTRY_CHURCH_ID,aal,String(reauthenticated)]);
 const result=await db.query(query,args);await db.query('COMMIT');return result.rows[0]?.result as T;
 }catch(e){await db.query('ROLLBACK');throw e;}finally{db.release();}
}
export function listAccess(userId:string,aal:string){return accessQuery<AccessSnapshot>(userId,aal,'SELECT ministry.access_list() AS result');}
export async function changeAccess(userId:string,aal:string,raw:unknown,reauthenticated=false){
 const input=accessChange.parse(raw);const token=['INVITE','REISSUE'].includes(input.action)?randomBytes(32).toString('hex'):undefined;
 if('role'in input&&input.role==='CONTENT'&&process.env.MINISTRY_CONTENT_ROLE_ENABLED!=='true'&&(input.action!=='UPDATE'||input.active))throw new Error('ACCESS_SETUP');
 await accessQuery(userId,aal,'SELECT ministry.access_change($1::jsonb) AS result',[JSON.stringify({...input,...(input.action==='INVITE'?{id:randomUUID(),email:input.email.toLowerCase()}:{}),...(token?{hash:invitationHash(token)}:{})})],reauthenticated);
 // Fragment tokens are not sent to servers, request logs or Referer. The recipient's browser posts them.
 return {ok:true,...(token?{invitationUrl:`${operationalOrigin()}/invite#${token}`}:{})};
}
export function checkInvitation(token:string,email:string,userId:string|null,send=false,accept=false){
 return accessQuery<{ok:boolean;name:string;role:string}>(userId,'aal1','SELECT ministry.invitation_action($1,$2,$3,$4) AS result',[invitationHash(token),email.toLowerCase(),send,accept]);
}
export const accessMessages:Record<string,string>={MINISTRY_LOGIN_REQUIRED:'로그인이 필요합니다.',ACCESS_SETUP:'권한 관리 DB 연결 준비가 필요합니다. 기존 로그인과 기록은 유지됩니다.',MINISTRY_MFA_REQUIRED:'설정한 2단계 인증을 완료하세요.',ACCESS_REAUTH:'현재 비밀번호를 다시 확인하세요.',ACCESS_FORBIDDEN:'최고관리자 권한이 필요합니다.',ACCESS_LAST_ADMIN:'마지막 최고관리자는 해제하거나 중지할 수 없습니다.',ACCESS_SELF:'본인의 최고관리자 권한은 여기서 해제할 수 없습니다. 다른 최고관리자에게 요청하세요.',ACCESS_CONFLICT:'다른 변경이 있습니다. 새로고침 후 다시 확인하세요.',ACCESS_INVALID:'권한과 담당 조직을 다시 확인하세요.',ACCESS_YEAR:'담당 조직의 연도가 변경되었습니다. 현재 연도로 다시 지정하세요.',ACCESS_REASON:'변경 사유를 입력하세요.',ACCESS_EXISTS:'이미 등록된 사용자입니다. 사용자 목록에서 권한을 변경하세요.',INVITATION_INVALID:'초대가 만료·취소되었거나 이메일이 일치하지 않습니다.',INVITATION_IDENTITY:'초대받은 이메일로 본인 확인을 완료하세요.',INVITATION_RATE:'인증 메일 요청이 많습니다. 잠시 후 다시 시도하세요.'};
export function accessError(e:unknown){const code=e instanceof Error?e.message:'';const key=Object.keys(accessMessages).find(k=>code.includes(k));return Response.json({message:key?accessMessages[key]:'요청을 처리하지 못했습니다. 입력 내용과 연결 상태를 확인하세요.'},{status:key==='MINISTRY_LOGIN_REQUIRED'?401:key==='ACCESS_SETUP'?503:key==='ACCESS_FORBIDDEN'?403:key==='ACCESS_CONFLICT'?409:400,headers:{'Cache-Control':'no-store'}});}
