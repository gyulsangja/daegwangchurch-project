import 'server-only';
import {DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {worshipSessionInput,worshipSessionPage,worshipSessionRow,worshipSessionQuery} from '@daegwang/contracts/worship-sessions';
import {worshipManagementPage} from '@daegwang/contracts/worship-management';
import {ministryTransaction} from '@daegwang/database/ministry-postgres';
import {listWorshipSessions,readWorshipSession,saveWorshipSession} from '@daegwang/database/ministry-worship';
import {ministryPool} from './operational-directory';
import {operationalEnabled} from './operational-config';
import {requestCmsManagement,type VerifiedSession} from './cms-management-client';
export async function worshipSessions(actor:Actor,raw:unknown,save=false,session?:VerifiedSession){
 if(!operationalEnabled()||actor.role!=='ADMIN'||!session)throw new DirectoryError('FORBIDDEN','예배 운영 기록 관리 권한이 필요합니다.');
 const security={aal:session.aal,enforceMfa:false,readOnly:true};
 if(!save){const q=worshipSessionQuery.parse(raw);return worshipSessionPage.parse(await ministryTransaction(ministryPool(),actor.id,actor.churchId,(db,grant)=>listWorshipSessions(db,grant,q.month,q.page),security));}
 const input=worshipSessionInput.parse(raw);
 const previous=await ministryTransaction(ministryPool(),actor.id,actor.churchId,(db,grant)=>readWorshipSession(db,grant,input.id),security);
 if((input.version===null&&previous)||(input.version!==null&&previous?.version!==input.version))throw new DirectoryError('CONFLICT','예배 기록이 변경되었습니다. 다시 열어 주세요.');
 const added=input.resources.filter(r=>r.kind!=='ATTENDANCE'&&!previous?.resources.some(p=>p.kind===r.kind&&p.id===r.id));
 if(added.length){
  const found=worshipManagementPage.parse(await requestCmsManagement(actor,'worship',{month:input.date.slice(0,7),kind:'RESOURCES',refs:JSON.stringify(added)},false,session));
  if(added.some(r=>!found.data.some(p=>p.kind===r.kind&&p.id===r.id)))throw new DirectoryError('INVALID','선택한 주보·말씀 중 삭제되거나 접근할 수 없는 자료가 있습니다.');
 }
 try{return {data:worshipSessionRow.parse(await ministryTransaction(ministryPool(),actor.id,actor.churchId,(db,grant)=>saveWorshipSession(db,grant,input),{...security,readOnly:false}))};}
 catch(e){if(e instanceof Error&&e.message==='WORSHIP_CONFLICT')throw new DirectoryError('CONFLICT','예배 기록이 변경되었습니다. 다시 열어 주세요.');if(e instanceof Error&&e.message==='WORSHIP_ATTENDANCE_INVALID')throw new DirectoryError('INVALID','연결할 출석부를 찾을 수 없습니다. 같은 교회의 저장된 출석부를 선택해 주세요.');throw e;}
}
