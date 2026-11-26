'use client';
import { useState } from 'react';
import { financeTotals, type FinanceSnapshot } from '@daegwang/contracts/finance';

const won = (value: number) => value.toLocaleString('ko-KR');
const titles = { settlement: '세입·세출 결산서', budget: '세입·세출 예산안', journal: '현금거래 분개장' };
type DocumentKind = keyof typeof titles;

export function MeetingReport({data, period}: {data: FinanceSnapshot; period: string}) {
  const [kind, setKind] = useState<DocumentKind>('settlement');
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
    <div className="finance-actions finance-no-print">
      <label>회의 자료<select value={documentKind} onChange={e => setKind(e.target.value as DocumentKind)}>
        <option value="settlement">{titles.settlement}</option><option value="budget">{titles.budget}</option>
        {detail && <option value="journal">{titles.journal}</option>}
      </select></label>
      <label>회의<select value={meeting} onChange={e => setMeeting(e.target.value)}><option>제직회</option><option>공동의회</option></select></label>
      <label>회의일<input type="date" value={date} onChange={e => setDate(e.target.value)}/></label>
      <button className="button primary" disabled={!data.version} onClick={() => window.print()}>선택한 자료 인쇄 / PDF 저장</button>
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
      : <><p>{data.closed ? '마감 회계연도' : '회계연도 마감 전 집계'}</p><h3>수지 총괄</h3>
        <div className="finance-table"><table><thead><tr>{['기초 잔액','기간 세입','기간 세출','수지 차액','기말 잔액'].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody><tr>{[opening,sums.income,sums.expense,sums.income-sums.expense,sums.balance].map((n,i) => <td key={i}>{won(n)}</td>)}</tr></tbody></table></div></>}
      {(['INCOME','EXPENSE'] as const).map(type => {
        const rows = data.categories.filter(c => c.kind === type);
        const budget = rows.reduce((sum,c) => sum+c.budget,0);
        const actual = rows.reduce((sum,c) => sum+c.actual,0);
        const values = (b:number,a:number) => <><td>{won(b)}</td>{!budgetOnly && <><td>{won(a)}</td><td>{won(type==='INCOME' ? a-b : b-a)}</td><td>{b ? (100*a/b).toFixed(1)+'%' : '—'}</td></>}</>;
        return <section key={type}><h3>{type==='INCOME' ? '세입' : '세출'} {budgetOnly ? '예산안' : '결산 명세'}</h3>
          <div className="finance-table"><table><thead><tr><th>항목</th><th>연간 예산액</th>{!budgetOnly && <><th>기간 결산액</th><th>{type==='INCOME' ? '예산 대비 증감' : '예산 잔액'}</th><th>예산 대비율</th></>}</tr></thead>
          <tbody>{rows.map(c => <tr key={c.id}><td>{categories.get(c.id)}</td>{values(c.budget,c.actual)}</tr>)}</tbody><tfoot><tr><th>합계</th>{values(budget,actual)}</tr></tfoot></table></div></section>;
      })}
      {!budgetOnly && <><h3>계좌별 기말 잔액</h3><div className="finance-table"><table><thead><tr><th>계좌</th><th>잔액</th></tr></thead><tbody>{data.accounts.map(a => <tr key={a.id}><td>{a.name}</td><td>{won(a.balance)}</td></tr>)}</tbody><tfoot><tr><th>합계</th><td>{won(sums.balance)}</td></tr></tfoot></table></div></>}
    </>}
  </section>;
}
