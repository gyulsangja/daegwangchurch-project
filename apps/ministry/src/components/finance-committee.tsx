'use client';
import {useEffect,useRef,useState} from 'react';
import type {FinanceCategory} from '@daegwang/contracts/finance';
import {groupedAccounts} from './finance-account-groups';

type Archive={id:string;revision:number;meetingDate:string;reference:string};
type Annual={version:number;year:number;available:boolean;closed:boolean;categories:FinanceCategory[]};
const won=(n:number)=>n.toLocaleString('ko-KR');
const types=['INCOME','EXPENSE'] as const;
const sum=(data:Annual,kind:typeof types[number],field:'actual'|'budget')=>data.categories.reduce((n,c)=>n+(c.kind===kind?c[field]:0),0);
export function FinanceCommittee({year,version,meetingDate,manager}:{manager:boolean;year:number;version:number;meetingDate:string}){
  const [reports,setReports]=useState<Annual[]|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  const [archives,setArchives]=useState<Archive[]>([]),[archive,setArchive]=useState<Archive|null>(null),[id,setId]=useState('');
  const [ref,setRef]=useState(''),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState('');
  const pending=useRef({signature:'',id:''});const saving=useRef(false);
  const [part,setPart]=useState('full'),[note,setNote]=useState('');
  useEffect(()=>{
    const cancel=new AbortController();setReports(null);setError(false);
    setArchive(null);setFeedback('');
    fetch('/api/v1/finance?year='+year+'&committeeFiles=1'+(id?'&archive='+encodeURIComponent(id):''),{cache:'no-store',signal:cancel.signal})
      .then(async response=>{if(!response.ok)throw Error();return response.json()})
      .then(v=>{if(cancel.signal.aborted)return;setReports(v.reports);if(id){setArchive(v);setNote(v.note);setArchives(list=>[{id:v.id,revision:v.revision,meetingDate:v.meetingDate,reference:v.reference},...list.filter(a=>a.id!==v.id)].sort((a,b)=>b.revision-a.revision))}else{setArchives(v.archives);setNote('')}})
      .catch(()=>{if(!cancel.signal.aborted)setError(true)});
    return ()=>cancel.abort();
  },[year,version,retry,id]);
  const [current,next]=reports??[];
  async function preserve(event:React.FormEvent){
    event.preventDefault();if(saving.current||!current||!next)return;
    const body={action:'COMMITTEE_ARCHIVE',year,version:current.version,nextVersion:next.version,meetingDate,reference:ref.trim(),note:note.trim()};
    const signature=JSON.stringify(body);if(pending.current.signature!==signature)pending.current={signature,id:crypto.randomUUID()};
    saving.current=true;setBusy(true);setFeedback('');
    try{const response=await fetch('/api/v1/finance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:pending.current.id})});
      const result=await response.json();if(!response.ok)throw Error(result.message||'보존에 실패했습니다.');

      setId(result.id);setRef('');pending.current={signature:'',id:''};
    }catch(e){setFeedback(e instanceof Error?e.message:'보존하지 못했습니다.')}finally{saving.current=false;setBusy(false)}
  }
  return <section className="committee-report">
    <div className="finance-no-print"><label>자료 버전<select disabled={busy} value={id} onChange={e=>setId(e.target.value)}><option value="">현재 장부 · 작업본</option>{archives.map(a=><option key={a.id} value={a.id}>보존본 {a.revision} · {a.meetingDate} · {a.reference}</option>)}</select></label></div>
    {archive&&<p>위원회 보존본 {archive.revision} · 회의록 근거 {archive.reference}</p>}
    <div className="finance-actions finance-no-print"><label>위원회 자료 구성<select value={part} onChange={e=>setPart(e.target.value)}><option value="full">보고 본문 + 세부 별첨</option><option value="main">보고 본문만</option><option value="detail">세부 별첨만</option></select></label>
    <button className="button primary" disabled={!reports||!reports.some(r=>r.available)} onClick={()=>window.print()}>선택한 자료 인쇄 / PDF 저장</button></div>
    <small>대한예수교장로회 대광교회 · 예결산위원회</small><h2>{year}년 결산안 · {year+1}년 예산안</h2>
    <p>위원회 심의자료 · 연간 전체 · 단위 원{(archive?.meetingDate||meetingDate)&&' · 회의일 '+(archive?.meetingDate||meetingDate)}</p>
    {error?<p role="alert">연간 자료 조회에 실패했습니다. <button onClick={()=>setRetry(retry+1)}>다시 조회</button></p>:!reports?<p role="status">두 회계연도의 자료를 불러오는 중…</p>:<>
      {!current.available&&<p>{year}년 결산 장부 미개설</p>}
      {!next.available&&<p>{year+1}년 예산 장부 미개설</p>}
      {part!=='detail'&&<>
        <h3>심의 안건 총괄</h3><div className="finance-table"><table><thead><tr><th>구분</th><th>당해 예산</th><th>당해 결산</th><th>달성·집행률</th><th>차년도 예산안</th><th>예산 증감액</th></tr></thead><tbody>
        {types.map(k=>{const budget=sum(current,k,'budget'),actual=sum(current,k,'actual'),proposal=sum(next,k,'budget');return <tr key={k}><th>{k==='INCOME'?'세입':'세출'}</th><td>{current.available?won(budget):'—'}</td><td>{current.available?won(actual):'—'}</td><td>{current.available&&budget?(100*actual/budget).toFixed(1)+'%':'—'}</td><td>{next.available?won(proposal):'—'}</td><td>{current.available&&next.available?won(proposal-budget):'—'}</td></tr>})}
        </tbody></table></div>
        {current.available&&<p>{year}년 수지 차액 {won(sum(current,'INCOME','actual')-sum(current,'EXPENSE','actual'))}원 · {current.closed?'장부 마감':'장부 마감 전 잠정 결산'}</p>}
        {next.available&&<p>{year+1}년 예산 수지 차액 {won(sum(next,'INCOME','budget')-sum(next,'EXPENSE','budget'))}원</p>}
        {!id&&<label className="finance-no-print">심의 안건·주요 증감 사유<textarea rows={2} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label>}{note&&<p style={{whiteSpace:'pre-wrap'}}>{note}</p>}
        <p>세입·세출은 장부에 반영된 현금·예금 거래 기준이며 계좌 간 이체는 제외합니다. 차년도 증감은 당해 편성 예산을 기준으로 합니다.</p>
      </>}
      {part!=='main'&&<div className={part==='full'?'committee-appendix':''}><h3>별첨 · 계정과목별 심의 명세</h3>
        {reports.filter(r=>r.available).map(report=><section key={report.year}><h3>{report.year}년 {report.year===year?'결산안':'예산안'}</h3><div className="finance-table"><table><thead><tr><th>분류·계정과목</th><th>예산액</th>{report.year===year&&<><th>결산액</th><th>결산 − 예산</th></>}</tr></thead><tbody>{groupedAccounts(report.categories).flatMap(group=>[
          <tr className="finance-group-total" key={group.name}><th>{group.name} 소계</th><td>{won(group.budget)}</td>{report.year===year&&<><td>{won(group.actual)}</td><td>{won(group.actual-group.budget)}</td></>}</tr>,
          ...group.items.map(c=><tr key={c.id}><th className="finance-account-name">{c.name}</th><td>{won(c.budget)}</td>{report.year===year&&<><td>{won(c.actual)}</td><td>{won(c.actual-c.budget)}</td></>}</tr>),
        ])}</tbody></table></div></section>)}</div>}
      {manager&&!id&&year<2200&&<details className="finance-no-print"><summary>심의 자료 보존</summary><form className="finance-actions" onSubmit={preserve}><label>회의록·심의 근거<input required maxLength={150} value={ref} onChange={e=>setRef(e.target.value)} placeholder="회의명·안건 번호"/></label><button className="button" disabled={busy||!meetingDate||(!current.available&&!next.available)}>현재 수치로 보존본 생성</button></form><p>헌금자 이름 등 개인정보는 메모에 적지 마세요. 보존 시점의 수치와 근거를 새 버전에 기록합니다.</p></details>}
      {feedback&&<p role="alert">{feedback} <button className="button" onClick={()=>setRetry(retry+1)}>장부 다시 조회</button></p>}
    </>}
  </section>;
}
