'use client';

import { useState } from 'react';
import type { FinanceSnapshot } from '@daegwang/contracts/finance';

type Props = {
  data: FinanceSnapshot;
  download: (rows: (string | number)[][], name: string) => void;
};

export function FinanceTax({ data, download }: Props) {
  const [person, setPerson] = useState('');
  const [payment, setPayment] = useState('');
  const [incomeType, setIncomeType] = useState('');
  const [national, setNational] = useState('');
  const [local, setLocal] = useState('');
  const [exempt, setExempt] = useState('');
  const paid = data.entries.filter(e => e.status === 'POSTED');
  const gifts = paid.filter(e => e.kind === 'INCOME' && person && e.memberId === person && data.categories.some(c => c.id === e.categoryId && c.offering));
  const expenses = paid.filter(e => e.kind === 'EXPENSE');
  const expense = expenses.find(e => e.id === payment);
  const gross = (expense?.amount ?? 0) + Number(national) + Number(local);
  return <section className="panel detail-body">
    <h2>기부금영수증 발급 검토</h2>
    <p>교적에 연결된 승인 헌금을 확인하고, 공제 대상과 실제 기부자를 확인한 뒤 홈택스에서 발급하세요.</p>
    <label>기부자 선택<select value={person} onChange={e => setPerson(e.target.value)}><option value="">교인 선택</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label>
    <p>확인 대상 {gifts.length}건 · {gifts.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}원</p>
    <button className="button" disabled={!gifts.length} onClick={() => download([['전표번호','기부자','기부일','헌금 항목','확인 대상 금액'], ...gifts.map(e => [e.id, data.members.find(m => m.id === person)!.name, e.date, data.categories.find(c => c.id === e.categoryId)!.name, e.amount])], '기부금발급검토')}>발급 검토표 내려받기</button>
    <a className="button" href="https://www.hometax.go.kr/" target="_blank" rel="noreferrer">홈택스 열기</a>
    <h2>목회자 사례비 지급 검토표</h2>
    <p>실수령액으로 기록한 지출 전표를 선택하세요. 다른 공제가 없는 지급 건에 사용하며, 확인한 세액을 입력해 검토표를 내려받습니다.</p>
    <form className="finance-form" onSubmit={e => {
      e.preventDefault();
      if (!expense || !incomeType || Number(exempt) > gross) return;
      download([['전표번호','지급일','지급처','소득 구분','총지급액','확인된 비과세액','과세 대상 지급액','소득세','지방소득세','실수령액'], [expense.id, expense.date, expense.party, incomeType, gross, Number(exempt), gross - Number(exempt), Number(national), Number(local), expense.amount]], '사례비지급검토');
    }}>
      <label>실지급 전표<select required value={payment} onChange={e => {setPayment(e.target.value);setNational('');setLocal('');setExempt('');setIncomeType('');}}><option value="">지출 선택</option>{expenses.map(e => <option key={e.id} value={e.id}>{e.date} · {e.party} · {e.amount.toLocaleString()}원 · {e.id.slice(-6)}</option>)}</select></label>
      <label>소득 구분<select required value={incomeType} onChange={e => setIncomeType(e.target.value)}><option value="">선택</option><option>기타소득(종교인소득)</option><option>근로소득</option></select></label>
      <label>원천징수 소득세<input required type="number" min="0" max="1000000000000" value={national} onChange={e => setNational(e.target.value)}/></label>
      <label>지방소득세<input required type="number" min="0" max="1000000000000" value={local} onChange={e => setLocal(e.target.value)}/></label>
      <label>요건을 확인한 비과세액<input required type="number" min="0" max={gross} value={exempt} onChange={e => setExempt(e.target.value)}/></label>
      <button className="button" disabled={!expense}>지급 검토표 내려받기</button>
    </form>
    <a href="https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238899&amp;mi=40170">국세청 지급명세서 서식 안내</a>
  </section>;
}
