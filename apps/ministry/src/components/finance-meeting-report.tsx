'use client';
import { useState } from 'react';
import { financeTotals, type FinanceSnapshot } from '@daegwang/contracts/finance';

const won=(n:number)=>n.toLocaleString('ko-KR');
export function MeetingReport({data,period}:{data:FinanceSnapshot;period:string}) {
  const [meeting,setMeeting]=useState('제직회');
  const [meetingDate,setMeetingDate]=useState(new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}));
  const sums=financeTotals(data);
  const opening=sums.balance-sums.income+sums.expense;
  return <section className="panel detail-body finance-print finance-meeting">
    <div className="finance-actions finance-no-print">
      <label>회의<select value={meeting} onChange={e=>setMeeting(e.target.value)}><option>제직회</option><option>공동의회</option></select></label>
      <label>회의일<input type="date" value={meetingDate} onChange={e=>setMeetingDate(e.target.value)}/></label>
      <button className="button primary" disabled={!data.version} onClick={()=>window.print()}>회의 자료 인쇄 / PDF 저장</button>
    </div>
    <small>대한예수교장로회 대광교회</small><h2>{meeting} 재정 보고서</h2>
    <p>보고 기간　{period}　{meetingDate&&' | 회의일　'+meetingDate}</p>
    <p>{data.closed?'연도 마감':'작성 중인 회계연도'} · 단위 원</p>
    <h3>수입·지출 총괄</h3>
    <div className="finance-table"><table><thead><tr>{['기초 잔액','기간 수입','기간 지출','수지 차액','기말 잔액'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody><tr>{[opening,sums.income,sums.expense,sums.income-sums.expense,sums.balance].map((x,i)=><td key={i}>{won(x)}</td>)}</tr></tbody></table></div>
    {(['INCOME','EXPENSE'] as const).map(kind=>{
      const rows=data.categories.filter(c=>c.kind===kind);
      const budget=rows.reduce((s,c)=>s+c.budget,0);
      const actual=rows.reduce((s,c)=>s+c.actual,0);
      return <section key={kind}><h3>{kind==='INCOME'?'수입 명세':'지출 명세'}</h3>
        <div className="finance-table"><table><thead><tr><th>항목</th><th>연간 예산</th><th>기간 실적</th><th>연간 예산 대비</th></tr></thead><tbody>
        {rows.map(c=><tr key={c.id}><td>{[c.section,c.name].filter(Boolean).join(' / ')}</td><td>{won(c.budget)}</td><td>{won(c.actual)}</td><td>{c.budget?(100*c.actual/c.budget).toFixed(1)+'%':'—'}</td></tr>)}
        </tbody><tfoot><tr><th>합계</th><td>{won(budget)}</td><td>{won(actual)}</td><td>{budget?(100*actual/budget).toFixed(1)+'%':'—'}</td></tr></tfoot></table></div></section>;
    })}
    <h3>계좌별 기말 잔액</h3><div className="finance-table"><table><thead><tr><th>계좌</th><th>잔액</th></tr></thead><tbody>{data.accounts.map(a=><tr key={a.id}><td>{a.name}</td><td>{won(a.balance)}</td></tr>)}</tbody><tfoot><tr><th>합계</th><td>{won(sums.balance)}</td></tr></tfoot></table></div>
  </section>;
}
