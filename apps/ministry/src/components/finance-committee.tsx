'use client';
import {useEffect,useState} from 'react';
import type {FinanceCategory} from '@daegwang/contracts/finance';
import {groupedAccounts} from './finance-account-groups';

type Annual={year:number;available:boolean;closed:boolean;categories:FinanceCategory[]};
const won=(n:number)=>n.toLocaleString('ko-KR');
const types=['INCOME','EXPENSE'] as const;
const sum=(data:Annual,kind:typeof types[number],field:'actual'|'budget')=>data.categories.reduce((n,c)=>n+(c.kind===kind?c[field]:0),0);
export function FinanceCommittee({year,version,meetingDate}:{year:number;version:number;meetingDate:string}){
  const [reports,setReports]=useState<Annual[]|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0);
  const [part,setPart]=useState('full'),[note,setNote]=useState('');
  useEffect(()=>{
    const cancel=new AbortController();setReports(null);setError(false);
    Promise.all([year,year+1].map(async y=>{
      if(y>2200)return {year:y,available:false,closed:false,categories:[]} as Annual;
      const r=await fetch('/api/v1/finance?year='+y+'&committee=1',{cache:'no-store',signal:cancel.signal});
      if(!r.ok)throw Error();return r.json() as Promise<Annual>;
    })).then(r=>{if(!cancel.signal.aborted)setReports(r)}).catch(()=>{if(!cancel.signal.aborted)setError(true)});
    return ()=>cancel.abort();
  },[year,version,retry]);
  const [current,next]=reports??[];
  return <section className="committee-report">
    <div className="finance-actions finance-no-print"><label>위원회 자료 구성<select value={part} onChange={e=>setPart(e.target.value)}><option value="full">보고 본문 + 세부 별첨</option><option value="main">보고 본문만</option><option value="detail">세부 별첨만</option></select></label>
    <button className="button primary" disabled={!reports||!reports.some(r=>r.available)} onClick={()=>window.print()}>선택한 자료 인쇄 / PDF 저장</button></div>
    <small>대한예수교장로회 대광교회 · 예결산위원회</small><h2>{year}년 결산안 · {year+1}년 예산안</h2>
    <p>위원회 심의자료 · 연간 전체 · 단위 원{meetingDate&&' · 회의일 '+meetingDate}</p>
    {error?<p role="alert">연간 자료 조회에 실패했습니다. <button onClick={()=>setRetry(retry+1)}>다시 조회</button></p>:!reports?<p role="status">두 회계연도의 자료를 불러오는 중…</p>:<>
      {!current.available&&<p>{year}년 결산 장부 미개설</p>}
      {!next.available&&<p>{year+1}년 예산 장부 미개설</p>}
      {part!=='detail'&&<>
        <h3>심의 안건 총괄</h3><div className="finance-table"><table><thead><tr><th>구분</th><th>당해 예산</th><th>당해 결산</th><th>달성·집행률</th><th>차년도 예산안</th><th>예산 증감액</th></tr></thead><tbody>
        {types.map(k=>{const budget=sum(current,k,'budget'),actual=sum(current,k,'actual'),proposal=sum(next,k,'budget');return <tr key={k}><th>{k==='INCOME'?'세입':'세출'}</th><td>{current.available?won(budget):'—'}</td><td>{current.available?won(actual):'—'}</td><td>{current.available&&budget?(100*actual/budget).toFixed(1)+'%':'—'}</td><td>{next.available?won(proposal):'—'}</td><td>{current.available&&next.available?won(proposal-budget):'—'}</td></tr>})}
        </tbody></table></div>
        {current.available&&<p>{year}년 수지 차액 {won(sum(current,'INCOME','actual')-sum(current,'EXPENSE','actual'))}원 · {current.closed?'장부 마감':'장부 마감 전 잠정 결산'}</p>}
        {next.available&&<p>{year+1}년 예산 수지 차액 {won(sum(next,'INCOME','budget')-sum(next,'EXPENSE','budget'))}원</p>}
        <label className="finance-no-print">심의 안건·주요 증감 사유 (이번 출력용)<textarea rows={2} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/></label>{note&&<p style={{whiteSpace:'pre-wrap'}}>{note}</p>}
        <p>세입·세출은 장부에 반영된 현금·예금 거래 기준이며 계좌 간 이체는 제외합니다. 차년도 증감은 당해 편성 예산을 기준으로 합니다.</p>
      </>}
      {part!=='main'&&<div className={part==='full'?'committee-appendix':''}><h3>별첨 · 계정과목별 심의 명세</h3>
        {reports.filter(r=>r.available).map(report=><section key={report.year}><h3>{report.year}년 {report.year===year?'결산안':'예산안'}</h3><div className="finance-table"><table><thead><tr><th>분류·계정과목</th><th>예산액</th>{report.year===year&&<><th>결산액</th><th>결산 − 예산</th></>}</tr></thead><tbody>{groupedAccounts(report.categories).flatMap(group=>[
          <tr className="finance-group-total" key={group.name}><th>{group.name} 소계</th><td>{won(group.budget)}</td>{report.year===year&&<><td>{won(group.actual)}</td><td>{won(group.actual-group.budget)}</td></>}</tr>,
          ...group.items.map(c=><tr key={c.id}><th className="finance-account-name">{c.name}</th><td>{won(c.budget)}</td>{report.year===year&&<><td>{won(c.actual)}</td><td>{won(c.actual-c.budget)}</td></>}</tr>),
        ])}</tbody></table></div></section>)}</div>}
    </>}
  </section>;
}
