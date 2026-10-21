'use client';
import { useState } from 'react';
import type { createDirectory } from '@daegwang/ministry-core/directory';
type Service = ReturnType<typeof createDirectory>;
type Props = { memberId: string; records: ReturnType<Service['records']['list']>; config: ReturnType<Service['config']>; roles: {code:string;label:string}[]; courses: {code:string;label:string}[]; canCare: boolean; initialKind?: string };
const kinds = { EDUCATION: '교육 이력', POSITION: '직분 이력', STATUS: '교적 변동', SETTLEMENT: '새가족 과정', SERVICE: '소속·봉사 기간', ATTENDANCE: '출석', CARE: '상담·심방' };
export function MemberRecords({memberId, records, config, roles, courses, canCare, initialKind}: Props) {
  const [kind, setKind] = useState<keyof typeof kinds>(initialKind && initialKind in kinds && (initialKind !== 'CARE' || canCare) ? initialKind as keyof typeof kinds : 'POSITION');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const today = new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Seoul'});
  const rows = records.filter(r => r.kind === kind);
  async function correct(recordId: string) {
    const reason = window.prompt('정정 사유를 입력하세요. 원래 기록은 정정 이력으로 남으며, 올바른 내용은 새로 등록합니다.');
    if (!reason?.trim()) return;
    setBusy(true);
    try { const response = await fetch(`/api/v1/members/${memberId}/records/${recordId}`, {method:'PATCH', headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})}); const result = await response.json(); if (!response.ok) throw new Error(result.message); const url = new URL(window.location.href); url.searchParams.set('recordKind',kind); window.location.assign(url); }
    catch(error) {setMessage(error instanceof Error ? error.message : '정정하지 못했습니다.');setBusy(false);}
  }
  async function submit(form: HTMLFormElement) {
    const data = new FormData(form); const get = (key:string) => String(data.get(key) ?? '');
    const body = {kind, date:get('date'), note:get('note'), ...(kind === 'EDUCATION' ? {courseId:get('courseId'),cohort:get('cohort'),value:get('value'),endDate:get('endDate') || null,teacher:get('teacher')} : kind === 'SERVICE' ? {organizationId:get('organizationId'),role:get('role'),endDate:get('endDate') || null} : kind === 'CARE' ? {category:get('category'),content:get('content'),nextDate:get('nextDate') || null} : kind === 'ATTENDANCE' ? {organizationId:get('organizationId'),event:get('event'),value:get('value')} : {value:get('value')})};
    setBusy(true); setMessage('');
    try { const response = await fetch(`/api/v1/members/${memberId}/records`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const result = await response.json(); if (!response.ok) throw new Error(result.message); const url = new URL(window.location.href); url.searchParams.set('recordKind',kind); window.location.assign(url); }
    catch(error) {setMessage(error instanceof Error ? error.message : '저장하지 못했습니다.'); setBusy(false);}
  }
  return <section className="panel records-panel"><div className="detail-body"><h2>교회생활 기록</h2><p className="muted">실제 발생일을 기준으로 기록합니다. 새가족 과정은 재적·이적 상태와 별개입니다. 소속·봉사 기간은 실제 활동 이력이며 연간 편성표는 환경설정에서 관리합니다.</p><div className="section-switcher">{Object.entries(kinds).filter(([key]) => key !== 'CARE' || canCare).map(([key,label]) => <button key={key} aria-pressed={kind === key} onClick={() => setKind(key as keyof typeof kinds)}>{label}</button>)}</div>
    {kind === 'CARE' && <p className="feedback">상담 열람 권한이 있는 담당자 전용입니다. 현재는 가상 자료로만 검토하며 실제 상담 내용을 입력하지 마세요.</p>}
    {kind === 'EDUCATION' && <p className="muted">교육 과정은 환경설정 → 체계 설정에서 추가합니다. 기수별로 반복 수강을 기록할 수 있습니다. 수료·중단 시 기존 기록을 정정한 뒤 종료일과 상태를 등록하세요. 교육 수료가 교적 상태나 직분을 자동 변경하지는 않습니다.</p>}
    <details key={kind}><summary>{kinds[kind]} 추가</summary><form className="form-grid record-form" onSubmit={event => {event.preventDefault(); void submit(event.currentTarget);}}>
      <label>{['SERVICE','EDUCATION'].includes(kind) ? '시작일' : '발생일'}<input name="date" type="date" required defaultValue={today} max={today}/></label>
      {kind === 'EDUCATION' && <><label>교육 과정<select name="courseId" required><option value="">과정을 선택하세요</option>{courses.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></label><label>기수·반<input name="cohort" maxLength={80} placeholder="2026년 가을반"/></label><label>담당 교역자·교사<input name="teacher" maxLength={80}/></label><label>교육 상태<select name="value"><option value="IN_PROGRESS">수강 중</option><option value="COMPLETED">수료</option><option value="STOPPED">중단</option></select></label><label>수료·중단일 (수강 중이면 비움)<input name="endDate" type="date" max={today}/></label></>}
      {['POSITION','STATUS','SETTLEMENT'].includes(kind) && <label>변경 내용<select name="value" required>{(kind === 'POSITION' ? config.positions : kind === 'STATUS' ? config.statuses : [{code:'NEW',label:'새가족'},{code:'LEARNING',label:'교육 중'},{code:'SETTLED',label:'정착'}]).map(c => <option key={c.code} value={c.code}>{c.label}</option>)}</select></label>}
      {(kind === 'SERVICE' || kind === 'ATTENDANCE') && <label>조직<select name="organizationId" required={kind === 'SERVICE'}>{kind === 'ATTENDANCE' && <option value="">교회 전체</option>}{config.organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
      {kind === 'SERVICE' && <><label>역할<select name="role"><option value="">구성원</option>{roles.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}</select></label><label>종료일 (계속 활동하면 비워 두세요)<input name="endDate" type="date"/></label></>}
      {kind === 'ATTENDANCE' && <><label>예배·모임 이름<input name="event" required maxLength={100} placeholder="주일 오전예배" list="attendance-events"/><datalist id="attendance-events">{['주일 오전예배','수요기도회','교회학교 예배','부서 모임'].map(v=><option key={v} value={v}/>)}</datalist></label><label>출석 상태<select name="value"><option value="PRESENT">출석</option><option value="ABSENT">결석</option><option value="EXCUSED">사유 결석</option><option value="ONLINE">온라인</option></select></label></>}
      {kind === 'CARE' && <><label>구분<select name="category"><option value="COUNSEL">목회 상담</option><option value="VISIT">심방</option></select></label><label className="full">상담 내용<textarea name="content" required maxLength={5000} rows={5}/></label><label>후속 일정<input name="nextDate" type="date"/></label></>}
      <label className="full">사유·메모<textarea name="note" maxLength={2000} rows={2}/></label><div className="full"><button className="button primary" disabled={busy}>{busy ? '저장 중…' : '기록 저장'}</button>{message && <p role="alert">{message}</p>}</div>
    </form></details>
    {rows.length ? <ul className="history-list">{rows.map(row => <li key={row.id}><strong>{row.date} · {row.label}</strong>{row.kind === 'EDUCATION' && <p>교육 기간: {row.date} ~ {row.endDate ?? '수강 중'}{row.teacher && ` · 담당: ${row.teacher}`}</p>}{row.kind === 'SERVICE' && <p>활동 기간: {row.date} ~ {row.endDate ?? '활동 중'}</p>}{row.kind === 'CARE' && <><p className="preserve-lines">{row.content}</p>{row.nextDate && <p>후속 일정: {row.nextDate}</p>}</>}<p className="preserve-lines">{row.note}</p>{row.voided ? <p role="status">정정됨: {row.correction?.reason}</p> : ['SERVICE','ATTENDANCE','CARE','EDUCATION'].includes(row.kind) && <button className="button" disabled={busy} onClick={() => void correct(row.id)}>기록 정정</button>}<small>입력일 {new Date(row.recordedAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</small></li>)}</ul> : <p className="empty">등록된 {kinds[kind]} 기록이 없습니다. 미기록은 결석이나 미활동을 뜻하지 않습니다.</p>}
    </div></section>;
}
