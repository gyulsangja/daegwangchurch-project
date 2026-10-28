import {notFound,redirect} from 'next/navigation';
import {z} from 'zod';
import {workspace} from '@/lib/workspace';
import {authenticatedSession} from '@/lib/auth-security';
import {ministryPool} from '@/lib/operational-directory';
import {ministryTransaction} from '@daegwang/database/ministry-postgres';
import {readWorshipSession,listWorshipAttendance} from '@daegwang/database/ministry-worship';
import {worshipSessionRow,worshipAttendancePage} from '@daegwang/contracts/worship-sessions';
import {worshipManagementPage,type WorshipManagementRow} from '@daegwang/contracts/worship-management';
import {requestCmsManagement} from '@/lib/cms-management-client';
import {PrintButton} from '@/components/print-button';
export default async function Page({searchParams}:{searchParams:Promise<{id?:string}>}){
 const id=z.uuid().safeParse((await searchParams).id);if(!id.success)notFound();
 const {actor,config}=await workspace();if(actor.role!=='ADMIN'||!actor.canPrint)redirect('/access-denied');
 const session=await authenticatedSession();
 const found=await ministryTransaction(ministryPool(),actor.id,actor.churchId,async(db,grant)=>{if(!grant.canPrint)return null;return readWorshipSession(db,grant,id.data);},{aal:session.aal,enforceMfa:false,readOnly:true});
 if(found===null)redirect('/access-denied');if(!found)notFound();const row=worshipSessionRow.parse(found);
 const attendanceIds=row.resources.filter(r=>r.kind==='ATTENDANCE').map(r=>r.id);const attendance=attendanceIds.length?worshipAttendancePage.parse(await ministryTransaction(ministryPool(),actor.id,actor.churchId,(db,grant)=>{if(!grant.canPrint)throw Error('MINISTRY_ACCESS_DENIED');return listWorshipAttendance(db,grant,row.date.slice(0,7),0,attendanceIds);},{aal:session.aal,enforceMfa:false,readOnly:true})).data:[];
 let resources:WorshipManagementRow[]=[];
 if(row.resources.length){try{resources=worshipManagementPage.parse(await requestCmsManagement(actor,'worship',{month:row.date.slice(0,7),kind:'RESOURCES',refs:JSON.stringify(row.resources.filter(r=>r.kind!=='ATTENDANCE'))},false,session)).data;}catch{/* Print the authorized internal record even if content service is unavailable. */}}
 const statuses={PREPARING:'준비 중',COMPLETED:'완료',CANCELLED:'취소',ARCHIVED:'보관'};
 return <><div className="no-print"><h1>예배 운영 기록 출력</h1><PrintButton/><p>내부 기록입니다. 홈페이지·앱에 공개되지 않습니다.</p></div><article className="print-document"><header className="print-heading"><small>대한예수교장로회</small><strong>{config.name}</strong><h1>{row.name}</h1><p>{row.date} · {statuses[row.status]}</p></header><h2>준비·진행 결과</h2><p style={{whiteSpace:'pre-wrap'}}>{row.notes||'작성된 메모가 없습니다.'}</p><h2>관련 자료</h2><ul>{row.resources.filter(r=>r.kind!=='ATTENDANCE').map(ref=>{const item=resources.find(r=>r.kind===ref.kind&&r.id===ref.id);return <li key={ref.kind+ref.id}>{ref.kind==='BULLETIN'?'주보':'말씀'} · {item?`${item.date} ${item.title}`:'연결 자료 (현재 제목 확인 불가)'}</li>;})}</ul><h2>연결 출석부</h2>{attendance.length?<ul>{attendance.map(a=><li key={a.id}>{a.date} · {a.event} · 명부 {a.memberCount}명</li>)}</ul>:<p>연결된 출석부가 없거나 현재 확인할 수 없습니다.</p>}<p>명부 인원은 실제 출석 인원과 다릅니다. 참석 현황은 연결 출석부에서 확인합니다.</p><footer>대광교회 · 내부 업무용 · 출력일 {new Date().toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</footer></article></>;
}
