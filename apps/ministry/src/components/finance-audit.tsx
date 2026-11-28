'use client';

import {useMemo,useState} from 'react';
import type {FinanceSnapshot} from '@daegwang/contracts/finance';

const actionLabels: Record<string,string>={COMMITTEE_ARCHIVE:'위원회 자료 보존',ENTRY_RECORD:'거래 즉시 반영',RECEIPT_WRITE:'서면 영수증 발급',ENTRY_SAVE:'전표 작성·수정',ENTRY_POST:'전표 승인',ENTRY_VOID:'전표 취소',YEAR_CREATE:'회계연도 개설',YEAR_CLOSE:'연도 마감',YEAR_REOPEN:'연도 마감 해제',MONTH_CLOSE:'월 마감',MONTH_REOPEN:'월 마감 해제',CATEGORY_CONFIG:'항목 설정',CATEGORY_SAVE:'항목 저장',ACCOUNT_SAVE:'계좌 저장',ACCESS_SAVE:'권한 변경',ADMIN_PROVISION:'최초 권한 지정',ISSUER_SETUP:'발급 단체 설정',RECEIPT_SHARE:'개인 영수증 발급',RECEIPT_CANCEL:'영수증 취소',ISSUE_PAPER:'영수증 발급',BUDGET_SAVE:'예산 변경'};
const koreaDay=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'});
const koreaTime=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const pageSize=12;

export function FinanceAudit({events}:{events:FinanceSnapshot['events']}){
  const [day,setDay]=useState(''),[action,setAction]=useState(''),[query,setQuery]=useState('');
  const [page,setPage]=useState(0);
  const records=useMemo(()=>events.map(event=>{
    const at=new Date(event.at);
    return {...event,day:koreaDay.format(at),time:koreaTime.format(at),label:actionLabels[event.action]??event.action};
  }),[events]);
  const dates=Array.from(new Set(records.map(r=>r.day)));
  const actions=Array.from(new Set(records.map(r=>r.action))).sort((a,b)=>(actionLabels[a]??a).localeCompare(actionLabels[b]??b,'ko'));
  const term=query.trim().toLocaleLowerCase();
  const rows=records.filter(r=>(!day||r.day===day)&&(!action||r.action===action)&&(!term||(r.label+' '+(r.reason??'')).toLocaleLowerCase().includes(term)));
  const pages=Math.ceil(rows.length/pageSize),current=Math.min(page,Math.max(0,pages-1));
  const shown=rows.slice(current*pageSize,(current+1)*pageSize);
  function reset(){setDay('');setAction('');setQuery('');setPage(0);}
  return <section className="panel detail-body">
    <h2>최근 처리 기록</h2>
    <p>선택한 회계연도의 변경과 공통 설정 변경을 최신순으로 최대 100건 표시합니다.</p>
    {!records.length?<p>기록된 변경이 없습니다.</p>:<>
      <div className="finance-actions finance-no-print">
        <label>처리일<select value={day} onChange={e=>{setDay(e.target.value);setPage(0)}}><option value="">전체 날짜</option>{dates.map(d=><option key={d}>{d}</option>)}</select></label>
        <label>작업 종류<select value={action} onChange={e=>{setAction(e.target.value);setPage(0)}}><option value="">전체 작업</option>{actions.map(a=><option key={a} value={a}>{actionLabels[a]??a}</option>)}</select></label>
        <label>작업명·사유 검색<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}}/></label>
        {(day||action||query)&&<button className="button" onClick={reset}>조건 초기화</button>}
      </div>
      <p role="status">{rows.length?'전체 '+rows.length+'건 중 '+(current*pageSize+1)+'–'+(current*pageSize+shown.length)+'건':'조건에 맞는 기록이 없습니다.'}</p>
      {shown.map((r,i)=><div key={current*pageSize+i}>
        {shown[i-1]?.day!==r.day&&<h3 className="audit-day">{r.day}</h3>}
        <div className="audit-event"><time dateTime={r.at}>{r.time}</time><div><strong>{r.label}</strong>{r.reason&&<p>{r.reason}</p>}</div></div>
      </div>)}
      {pages>1&&<div className="finance-actions"><button className="button" disabled={!current} onClick={()=>setPage(current-1)}>이전</button><span>{current+1} / {pages}페이지</span><button className="button" disabled={current+1===pages} onClick={()=>setPage(current+1)}>다음</button></div>}
    </>}
  </section>;
}
