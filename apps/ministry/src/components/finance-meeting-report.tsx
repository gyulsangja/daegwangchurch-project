'use client';
import {groupedAccounts} from './finance-account-groups';
import { Fragment, useState } from 'react';
import { financeTotals, type FinanceSnapshot } from '@daegwang/contracts/finance';

const won = (value: number) => value.toLocaleString('ko-KR');
const ratio=(actual:number,budget:number)=>budget ? (100*actual/budget).toLocaleString('ko-KR',{maximumFractionDigits:1})+'%' : '예산 미편성';
const titles = { settlement: '세입·세출 결산서', budget: '세입·세출 예산안', journal: '현금거래 분개장' };
type DocumentKind = keyof typeof titles;

type ReportProps={data:FinanceSnapshot;period:string;enabled:boolean;save:(command:Record<string,unknown>)=>Promise<boolean>;editAccounts:()=>void;closeBooks:()=>void;download:(rows:(string|number)[][],name:string)=>void};
export function MeetingReport({data,period,enabled,save,editAccounts,closeBooks,download}:ReportProps) {
  const [kind, setKind] = useState<DocumentKind>('settlement');
  const [editId,setEditId]=useState('');
  const [meeting, setMeeting] = useState('제직회');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Seoul'}));
  const detail = !!data.role && data.role !== 'REPORTER';
  const documentKind = kind === 'journal' && !detail ? 'settlement' : kind;
  const budgetOnly = documentKind === 'budget';
  const sums = financeTotals(data);
  const opening = sums.balance - sums.income + sums.expense;
  const accounts = new Map(data.accounts.map(a => [a.id, a.name]));
  const categories = new Map(data.categories.map(c => [c.id, [c.section, c.name].filter(Boolean).join(' / ')]));
  const posted = documentKind === 'journal' ? data.entries.filter(e => e.status === 'POSTED').sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)) : [];
  const journalTotal = posted.reduce((sum,e) => sum + e.amount, 0);
  const incomeBudget = data.categories.filter(c => c.kind === 'INCOME').reduce((sum,c) => sum + c.budget, 0);
  return <section className="panel detail-body finance-print finance-meeting">
    <div className="finance-view-switch finance-no-print" aria-label="재정 자료 선택">{(Object.keys(titles) as DocumentKind[]).filter(k=>k!=='journal'||detail).map(k=><button type="button" key={k} className="button" aria-pressed={documentKind===k} onClick={()=>{setKind(k);setEditId('')}}>{k==='settlement'?'결산':k==='budget'?'예산안':'분개장'}</button>)}</div>
    <div className="finance-actions finance-no-print">
      {data.role==='MANAGER'&&budgetOnly&&<button className="button" onClick={editAccounts}>예산 항목 관리</button>}
      {data.role==='MANAGER'&&documentKind==='settlement'&&<button className="button" onClick={closeBooks}>장부 마감 관리</button>}
      <details className="finance-output-options"><summary className="button">인쇄·내려받기</summary><div className="finance-actions">
      <label>회의<select value={meeting} onChange={e=>setMeeting(e.target.value)}><option>제직회</option><option>공동의회</option></select></label>
      <label>회의일<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <button className="button primary" disabled={!data.version} onClick={()=>window.print()}>인쇄 / PDF 저장</button>
      <button className="button" disabled={!data.version} onClick={()=>{
        if(documentKind==='journal'){download([['거래일','차변','차변 금액','대변','대변 금액'],...posted.map(e=>{const source=accounts.get(e.accountId)??'';const category=categories.get(e.categoryId??'')??'';return [e.date,e.kind==='TRANSFER'?accounts.get(e.destinationId??'')??'':e.kind==='INCOME'?source:category,e.amount,e.kind==='INCOME'?category:source,e.amount]})],titles.journal);return;}
        download([[budgetOnly?'회계연도':'보고 기간','구분','상위 분류','항목','연간 예산',...(budgetOnly?[]:['기간 결산'])],...data.categories.map(c=>[budgetOnly?data.year:period,c.kind==='EXPENSE'?'세출':c.offering?'세입 · 헌금':'세입 · 기타 수입',c.section??'',c.name,c.budget,...(budgetOnly?[]:[c.actual])])],titles[documentKind]);
      }}>CSV 저장</button></div></details>
    </div>
    <small>대한예수교장로회 대광교회 · {meeting}</small>
    <h2>{titles[documentKind]}</h2>
    <p>{budgetOnly ? data.year+'년도 연간 예산' : period}{date && '　|　회의일 '+date}　·　단위 원</p>
    {documentKind === 'journal' ? <>
      <p>선택 기간에 장부에 반영된 수입·지출·계좌이체를 날짜순으로 표시합니다.</p>
      <div className="finance-table"><table><thead><tr>{['거래일','차변 계정','차변 금액','대변 계정','대변 금액'].map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{posted.map(e => {
        const source = accounts.get(e.accountId);
        const category = categories.get(e.categoryId ?? '');
        const debit = e.kind === 'TRANSFER' ? accounts.get(e.destinationId ?? '') : e.kind === 'INCOME' ? source : category;
        const credit = e.kind === 'INCOME' ? category : source;
        return <tr key={e.id}><td>{e.date}</td><td>{debit ?? '계정 확인 필요'}</td><td>{won(e.amount)}</td><td>{credit ?? '계정 확인 필요'}</td><td>{won(e.amount)}</td></tr>;
      })}{!posted.length && <tr><td colSpan={5}>이 기간에 반영된 거래가 없습니다.</td></tr>}</tbody>
      <tfoot><tr><th colSpan={2}>합계</th><td>{won(journalTotal)}</td><td></td><td>{won(journalTotal)}</td></tr></tfoot></table></div>
    </> : <>
      {budgetOnly ? <p>세입 예산 {won(incomeBudget)}원　·　세출 예산 {won(sums.budget)}원　·　차액 {won(incomeBudget-sums.budget)}원</p>
      : <><p>{data.closed ? '마감 회계연도' : '회계연도 마감 전 집계'}</p><div className="finance-summary-pair">
        {([{title:'세입 달성률',budget:incomeBudget,actual:sums.income},{title:'세출 집행률',budget:sums.budget,actual:sums.expense}]).map(item=><div key={item.title}><h3>{item.title}</h3><strong>{ratio(item.actual,item.budget)}</strong><p>기간 실적 {won(item.actual)}원 / 연간 {item.title==='세입 달성률'?'목표':'예산'} {won(item.budget)}원</p></div>)}</div>
        <h3>수지 총괄</h3>
        <div className="finance-table"><table><thead><tr>{['기초 잔액','기간 세입','기간 세출','수지 차액','기말 잔액'].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody><tr>{[opening,sums.income,sums.expense,sums.income-sums.expense,sums.balance].map((n,i) => <td key={i}>{won(n)}</td>)}</tr></tbody></table></div></>}
      {(['INCOME','EXPENSE'] as const).map(type => {
        const rows = data.categories.filter(c => c.kind === type);
        const budget = rows.reduce((sum,c) => sum+c.budget,0);
        const actual = rows.reduce((sum,c) => sum+c.actual,0);
        const values = (b:number,a:number) => <><td>{won(b)}</td>{!budgetOnly && <><td>{won(a)}</td><td>{won(type==='INCOME' ? a-b : b-a)}</td><td>{ratio(a,b)}</td></>}</>;
        return <section key={type}><h3>{type==='INCOME' ? '세입' : '세출'} {budgetOnly ? '예산안' : '결산 명세'}</h3>
          <div className="finance-table"><table><thead><tr><th>항목</th><th>{type==='INCOME'?'연간 세입 목표액':'연간 세출 예산액'}</th>{budgetOnly&&data.role==='MANAGER'&&<th className="finance-no-print">편성</th>}{!budgetOnly && <><th>기간 결산액</th><th>{type==='INCOME' ? '목표 대비 증감' : '예산 대비 차액'}</th><th>{type==='INCOME'?'세입 달성률':'세출 집행률'}</th></>}</tr></thead>
          <tbody>{groupedAccounts(rows).map(group=><Fragment key={group.name}><tr className="finance-group-total"><th scope="row">{group.name} 소계</th>{values(group.budget,group.actual)}{budgetOnly&&data.role==='MANAGER'&&<td className="finance-no-print"/>}</tr>{group.items.map(c=><Fragment key={c.id}><tr><th scope="row" className="finance-account-name">{c.name}{c.active===false?' (사용 중지)':''}</th>{values(c.budget,c.actual)}{budgetOnly&&data.role==='MANAGER'&&<td className="finance-no-print"><button type="button" className="button" disabled={!enabled} aria-label={c.name+' 예산 수정'} onClick={()=>setEditId(c.id)}>수정</button></td>}</tr>{editId===c.id&&budgetOnly&&data.role==='MANAGER'&&<tr className="finance-no-print"><td colSpan={3}><form className="finance-actions" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(await save({action:'BUDGET_SAVE',categoryId:c.id,amount:Number(f.get('amount')),reason:f.get('reason')}))setEditId('')}}><label>{c.name} 연간 예산 · 원<input autoFocus required type="number" name="amount" min="0" max="1000000000000" defaultValue={c.budget}/></label><label>편성·추경 사유<input required name="reason" maxLength={300}/></label><button className="button primary" disabled={!enabled}>예산 저장</button><button type="button" className="button" onClick={()=>setEditId('')}>취소</button></form></td></tr>}</Fragment>)}</Fragment>)}</tbody><tfoot><tr><th>합계</th>{values(budget,actual)}</tr></tfoot></table></div></section>;
      })}
      {!budgetOnly && <><h3>계좌별 기말 잔액</h3><div className="finance-table"><table><thead><tr><th>계좌</th><th>잔액</th></tr></thead><tbody>{data.accounts.map(a => <tr key={a.id}><td>{a.name}</td><td>{won(a.balance)}</td></tr>)}</tbody><tfoot><tr><th>합계</th><td>{won(sums.balance)}</td></tr></tfoot></table></div></>}
    </>}
  </section>;
}
