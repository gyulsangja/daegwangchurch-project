'use client';

import { PeriodPicker, type Period } from './finance-period';
import {MonthClose, CategoryEditor} from './finance-controls';
import { FinanceTax } from './finance-tax';
import { LogoutButton } from './logout-button';
import { useEffect, useRef, useState } from 'react';
import { financeCsv, financeRoles, financeTotals, type FinanceEntry, type FinanceSnapshot } from '@daegwang/contracts/finance';

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;
const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const kinds = { INCOME: '수입 · 헌금', EXPENSE: '지출', TRANSFER: '계좌 이체' };
const states = { DRAFT: '승인 대기', POSTED: '집행 완료', VOID: '취소' };
type Tab = 'tax' | 'overview' | 'entries' | 'giving' | 'budget' | 'settings' | 'access';
const tabs: { id: Tab; title: string }[] = [
  { id: 'overview', title: '재정 현황' }, { id: 'entries', title: '수입·지출 장부' },
  { id: 'giving', title: '헌금 내역' }, { id: 'tax', title: '기부금·사례비' }, { id: 'budget', title: '예산·결산' },
  { id: 'settings', title: '마감·계좌·항목' }, { id: 'access', title: '재정 접근 권한' },
];

export function FinanceWorkspace({ministryUrl}:{ministryUrl:string}) {
  const [year, setYear] = useState(Number(today().slice(0, 4)));
  const [data, setData] = useState<FinanceSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<Period | null>(null);
  const range = ['settings','access'].includes(tab) ? null : period;
  const periodQuery = range ? '&'+new URLSearchParams(range).toString() : '';
  const periodLabel = range ? range.start+' ~ '+range.end : year+'년 전체';
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [review, setReview] = useState<FinanceEntry | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const lock = useRef(false);
  const pending = useRef<{ signature: string; id: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/v1/finance?year=${year}${periodQuery}`, { cache: 'no-store', signal: controller.signal });
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        if (!controller.signal.aborted) setData(value);
      } catch (cause) {
        if (!controller.signal.aborted) { setData(null); setError(cause instanceof Error ? cause.message : '재정 자료를 불러오지 못했습니다.'); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [year, reload, periodQuery]);

  async function save(command: Record<string, unknown>) {
    if (lock.current || !data) return false;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    const body = { ...(command.action === 'ACCESS_SAVE' ? {} : { year, version: data.version }), ...command };
    const signature = JSON.stringify({ ...body, password: undefined });
    if (pending.current?.signature !== signature) pending.current = { signature, id: crypto.randomUUID() };
    try {
      const response = await fetch('/api/v1/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, requestId: pending.current.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      if (!result.saved) throw new Error('저장 결과를 확인하지 못했습니다.');
      pending.current = null; setNotice('저장했습니다.'); setReload(value => value + 1);
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 다시 시도하세요.'); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  function formAction(event: React.FormEvent<HTMLFormElement>, build: (form: FormData) => Record<string, unknown>) {
    event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
    void save(build(fields)).then(saved => { if (saved) form.reset(); });
  }
  const manager = data?.role === 'MANAGER';
  const writer = manager || data?.role === 'BOOKKEEPER';
  const detail = !!data?.role && data.role !== 'REPORTER';
  const enabled = !!data?.version && !data.closed && !loading && !busy;
  const activeTab = data && !data.role && data.canManageAccess ? 'access' : tab;
  const visibleTabs = tabs.filter(item => item.id === 'access' ? data?.canManageAccess : ['settings','tax'].includes(item.id) ? manager : ['entries', 'giving'].includes(item.id) ? detail : !!data?.role);
  const totals = data ? financeTotals(data) : { income: 0, expense: 0, budget: 0, balance: 0 };
  const accountName = (id: string | null) => data?.accounts.find(a => a.id === id)?.name ?? '';
  const categoryName = (id: string | null) => data?.categories.find(c => c.id === id)?.name ?? '계좌 이체';
  const partyName = (entry: FinanceEntry) => (data?.members.find(m => m.id === entry.memberId)?.name ?? entry.party) || '무명';
  const filtered = data?.entries.filter(entry => (status === 'ALL' || entry.status === status) && `${entry.date} ${partyName(entry)} ${entry.memo} ${categoryName(entry.categoryId)} ${entry.receipt}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ?? [];
  function download(rows: (string | number)[][], name: string) {
    const url = URL.createObjectURL(new Blob([financeCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${periodLabel}-${name}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function newEntry() {
    setReview(null);
    setEditing({ id: crypto.randomUUID(), date: range ? (range.start<=today() && today()<=range.end ? today() : range.start) : year === Number(today().slice(0, 4)) ? today() : `${year}-01-01`, kind: 'INCOME', accountId: data?.accounts[0]?.id ?? '', destinationId: null, categoryId: data?.categories.find(c => c.kind === 'INCOME' && c.active!==false)?.id ?? null, amount: 0, memberId: null, party: '', memo: '', receipt: '', status: 'DRAFT', createdBy: '', approvedBy: null });
  }
  return <section className="finance-page">
    <header className="finance-heading"><div><p className="eyebrow">대한예수교장로회 대광교회</p><h1>재정 관리</h1><p>헌금과 집행 내역을 기록하고, 연간 예산과 결산을 함께 확인합니다.</p></div><div className="finance-actions"><label>회계연도<select value={year} disabled={busy || !!editing} onChange={event => { setPeriod(null); setYear(Number(event.target.value)); setData(null); setPage(0); setReview(null); }}>{Array.from(new Set([...(data?.years ?? []), ...Array.from({ length: Number(today().slice(0, 4)) + 6 - 2000 }, (_, index) => 2000 + index)])).sort((a, b) => b - a).map(value => <option key={value}>{value}</option>)}</select></label><a className="button" href={ministryUrl}>목회시스템으로 돌아가기</a><LogoutButton /></div></header>
    {data && <p className="finance-role">{data.role ? financeRoles[data.role] : '재정 권한 지정'} · {data.version ? data.closed ? '마감된 연도' : '장부 작성 중' : '회계연도 개설 전'}</p>}
    <div className="finance-layout"><nav className="finance-tabs" aria-label="재정 업무">{visibleTabs.map(item => <button key={item.id} disabled={busy || !!editing} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => { setTab(item.id); setReview(null); }}>{item.title}</button>)}</nav><div className="finance-content">
    <div hidden={!data?.role || ['settings','access'].includes(activeTab)}><PeriodPicker key={year} year={year} disabled={busy || !!editing} onChange={next=>{setPeriod(next);setReview(null);setPage(0);}}/></div>
    {data?.role && !['settings','access'].includes(activeTab) && <p className="finance-period-caption">{periodLabel}</p>}
    {loading && <p role="status">재정 자료를 불러오는 중…</p>}
    {error && <div className="finance-error" role="alert"><p>{error}</p><button className="button" disabled={busy} onClick={() => setReload(value => value + 1)}>새로고침</button> <a href="/login?next=/finance">다시 로그인</a></div>}
    <p role="status">{notice}</p>
    {data && !loading && <>
      {data.role && !data.version && <div className="panel detail-body"><h2>{year}년 장부를 시작하세요</h2><p>재정 책임자가 회계연도를 개설하고 입출금 계좌의 기초잔액을 입력하면 기록할 수 있습니다.</p>{manager && <form onSubmit={e => formAction(e, f => ({ action: 'YEAR_CREATE', carry: f.get('carry') === 'on' }))}><label className="check"><input type="checkbox" name="carry"/>마감된 전년도 잔액·항목·예산 이월</label><button className="button primary" disabled={busy}>회계연도 개설</button></form>}</div>}
      {activeTab === 'overview' && data.role && <>
        <div className="finance-metrics">{[['수입 합계', totals.income], ['지출 합계', totals.expense], ['연간 지출 예산', totals.budget], ['기간 말 잔액', totals.balance]].map(([label, value]) => <article className="panel" key={label}><span>{label}</span><strong>{won(Number(value))}</strong></article>)}</div>
        <div className="finance-columns"><section className="panel detail-body"><h2>기간 말 계좌 잔액</h2>{data.accounts.map(account => <div className="finance-line" key={account.id}><span>{account.name}</span><strong>{won(account.balance)}</strong></div>)}{!data.accounts.length && <p>등록된 계좌가 없습니다.</p>}</section><section className="panel detail-body"><h2>기간 집행 / 연간 예산</h2>{data.categories.filter(c => c.kind === 'EXPENSE').map(category => <div className="finance-progress" key={category.id}><div className="finance-line"><span>{category.name}</span><strong>{category.budget ? Math.round(category.actual / category.budget * 100) : category.actual ? '예산 미등록' : 0}{category.budget ? '%' : ''}</strong></div><progress aria-label={`${category.name} 집행률`} max={Math.max(category.budget, category.actual, 1)} value={category.actual}/><small>{won(category.actual)} / {won(category.budget)}{category.actual > category.budget && ' · 예산 초과'}</small></div>)}</section></div>
        {detail && <section className="panel detail-body"><h2>승인 대기 {data.entries.filter(e => e.status === 'DRAFT').length}건</h2><p>승인된 전표가 수입·지출과 잔액에 반영됩니다. 계좌 간 이체는 수입·지출 합계에서 제외됩니다.</p><button className="button" onClick={() => { setStatus('DRAFT'); setTab('entries'); }}>승인 대기 확인</button></section>}
      </>}
      {activeTab === 'entries' && detail && <>
        {editing ? <form className="panel detail-body" onSubmit={event => { event.preventDefault(); void save({ action: 'ENTRY_SAVE', ...Object.fromEntries(Object.entries(editing).filter(([key]) => !['status', 'createdBy', 'approvedBy'].includes(key))) }).then(saved => { if (saved) setEditing(null); }); }}>
          <h2>수입·지출 전표 작성</h2><fieldset disabled={busy || data.closed} className="finance-form">
            <label>거래 종류<select value={editing.kind} onChange={event => { const kind = event.target.value as FinanceEntry['kind']; setEditing({ ...editing, kind, categoryId: kind === 'TRANSFER' ? null : data.categories.find(c => c.kind === kind)?.id ?? null, destinationId: kind === 'TRANSFER' ? data.accounts.find(a => a.id !== editing.accountId)?.id ?? null : null, memberId: null }); }}>{Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label>거래일<input type="date" required min={`${year}-01-01`} max={`${year}-12-31`} value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })}/></label>
            <label>{editing.kind === 'INCOME' ? '입금 계좌' : '출금 계좌'}<select required value={editing.accountId} onChange={e => setEditing({ ...editing, accountId: e.target.value })}><option value="">계좌 선택</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            {editing.kind === 'TRANSFER' ? <label>입금 계좌<select required value={editing.destinationId ?? ''} onChange={e => setEditing({ ...editing, destinationId: e.target.value })}><option value="">계좌 선택</option>{data.accounts.filter(a => a.id !== editing.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label> : <label>항목<select required value={editing.categoryId ?? ''} onChange={e => setEditing({ ...editing, categoryId: e.target.value })}><option value="">항목 선택</option>{data.categories.filter(c => c.kind === editing.kind && c.active!==false).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
            <label>금액 · 원<input type="number" min={1} max={1_000_000_000_000} step={1} required value={editing.amount || ''} onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}/></label>
            {editing.kind === 'INCOME' && <label>헌금자 · 교적 연결<select value={editing.memberId ?? ''} onChange={e => setEditing({ ...editing, memberId: e.target.value || null, party: '' })}><option value="">무명 또는 직접 입력</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label>}
            {!editing.memberId && <label>{editing.kind === 'EXPENSE' ? '지급처' : '이름 · 무명은 공란'}<input maxLength={100} value={editing.party} onChange={e => setEditing({ ...editing, party: e.target.value })}/></label>}
            <label>적요<input maxLength={1000} required value={editing.memo} onChange={e => setEditing({ ...editing, memo: e.target.value })}/></label>
            <label className="finance-wide">증빙번호 · 영수증 보관 위치<input maxLength={300} value={editing.receipt} onChange={e => setEditing({ ...editing, receipt: e.target.value })}/><small>통장 거래번호 또는 별도로 보관한 증빙의 위치를 적으세요.</small></label>
          </fieldset><div className="finance-actions"><button className="button primary" disabled={busy || data.closed}>승인 대기로 저장</button><button className="button" type="button" disabled={busy} onClick={() => setEditing(null)}>목록으로</button></div>
        </form> : <>
          <div className="finance-actions"><input aria-label="장부 검색" placeholder="헌금자·적요·항목 검색" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/><select aria-label="처리 상태" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="ALL">전체 상태</option>{Object.entries(states).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{writer && <button className="button primary" disabled={!enabled || !data.accounts.length} onClick={newEntry}>수입·지출 등록</button>}<button className="button" onClick={() => download([['날짜', '종류', '항목', '계좌', '이름·지급처', '금액', '적요', '증빙', '상태'], ...filtered.map(e => [e.date, kinds[e.kind], categoryName(e.categoryId), accountName(e.accountId), partyName(e), e.amount, e.memo, e.receipt, states[e.status]])], '장부')}>CSV 내려받기</button></div>
          {review && <form className="panel detail-body" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value'); void save({ action, id: review.id, reason: String(form.get('reason')) }).then(saved => { if (saved) setReview(null); }); }}><h2>{review.date} · {categoryName(review.categoryId)} · {won(review.amount)}</h2><p>{review.memo} · {partyName(review)}</p>{review.kind === 'EXPENSE' && <p>항목 예산 {won(data.categories.find(c => c.id === review.categoryId)?.budget ?? 0)} · 현재 집행 {won(data.categories.find(c => c.id === review.categoryId)?.actual ?? 0)}</p>}<label>승인·취소 사유<input name="reason" required maxLength={300}/></label><div className="finance-actions">{review.status === 'DRAFT' && <button value="ENTRY_POST" className="button primary" disabled={!enabled}>승인 · 집행 반영</button>}<button value="ENTRY_VOID" className="button" disabled={!enabled}>전표 취소</button><button type="button" className="button" disabled={busy} onClick={() => setReview(null)}>닫기</button></div></form>}
          <div className="finance-table"><table><thead><tr><th>날짜·상태</th><th>항목·적요</th><th>계좌</th><th>헌금자·지급처</th><th>금액</th><th>처리</th></tr></thead><tbody>{filtered.slice(page * 20, page * 20 + 20).map(entry => <tr key={entry.id}><td>{entry.date}<small>{states[entry.status]}</small></td><td>{categoryName(entry.categoryId)}<small>{entry.memo}</small>{entry.receipt && <small>증빙 {entry.receipt}</small>}</td><td>{accountName(entry.accountId)}{entry.destinationId && ` → ${accountName(entry.destinationId)}`}</td><td>{partyName(entry)}</td><td>{won(entry.amount)}</td><td>{writer && entry.status === 'DRAFT' && <button className="button" disabled={!enabled} onClick={() => setEditing(entry)}>수정</button>}{manager && entry.status !== 'VOID' && <button className="button" disabled={!enabled} onClick={() => setReview(entry)}>승인·취소</button>}</td></tr>)}</tbody></table>{!filtered.length && <p>조건에 맞는 전표가 없습니다.</p>}</div><div className="finance-actions"><span>{filtered.length}건 · {page + 1}페이지</span><button className="button" disabled={!page} onClick={() => setPage(page - 1)}>이전</button><button className="button" disabled={(page + 1) * 20 >= filtered.length} onClick={() => setPage(page + 1)}>다음</button></div>
        </>}
      </>}
      {activeTab === 'tax' && manager && <FinanceTax save={save} key={periodLabel} data={data} download={download}/>} 
      {activeTab === 'giving' && detail && <GivingReport data={data} partyName={partyName} download={download}/>}
      {activeTab === 'budget' && data.role && <section className="panel detail-body finance-print"><div className="finance-actions"><h2>예산·결산</h2><button className="button" onClick={() => window.print()}>인쇄</button><button className="button" onClick={() => download([['구분', '항목', '연간 예산', '기간 집행', '연간 잔여'], ...data.categories.map(c => [kinds[c.kind], c.name, c.budget, c.actual, c.budget - (c.annualActual ?? c.actual)])], '예산결산')}>CSV 내려받기</button></div><p>수입 {won(totals.income)} · 지출 {won(totals.expense)} · 잔액 {won(totals.balance)}</p><div className="finance-table"><table><thead><tr><th>구분</th><th>항목</th><th>연간 예산</th><th>기간 집행</th><th>연간 잔여</th></tr></thead><tbody>{data.categories.map(c => <tr key={c.id}><td>{kinds[c.kind]}</td><td>{c.name}</td><td>{won(c.budget)}</td><td>{won(c.actual)}</td><td>{won(c.budget - (c.annualActual ?? c.actual))}</td></tr>)}</tbody></table></div>{manager && <form className="finance-form finance-no-print" onSubmit={e => formAction(e, f => ({ action: 'BUDGET_SAVE', categoryId: f.get('categoryId'), amount: Number(f.get('amount')), reason: f.get('reason') }))}><label>예산 항목<select name="categoryId" required>{data.categories.map(c => <option key={c.id} value={c.id}>{kinds[c.kind]} · {c.name}</option>)}</select></label><label>연간 예산 · 원<input name="amount" type="number" step={1} min={0} max={1_000_000_000_000} required/></label><label>편성·추경 사유<input name="reason" maxLength={300} required/></label><button className="button primary" disabled={!enabled}>예산 저장</button></form>}</section>}
      {activeTab === 'settings' && manager && <div className="finance-columns">
        <section className="panel detail-body"><h2>입출금 계좌</h2><p>현금·보통예금 등 이름과 연초 기초잔액을 기록하세요.</p>{data.accounts.map(account => <div className="finance-line" key={account.id}><span>{account.name}</span><strong>기초 {won(account.opening)}</strong></div>)}<form className="finance-form" onSubmit={e => formAction(e, f => ({ action: 'ACCOUNT_SAVE', id: f.get('id') || crypto.randomUUID(), name: f.get('name'), opening: Number(f.get('opening')) }))}><label>새 계좌 · 기존 수정<select name="id"><option value="">새 계좌</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>계좌 이름<input name="name" maxLength={100} required/></label><label>기초잔액 · 원<input name="opening" type="number" min={0} step={1} max={1_000_000_000_000} required defaultValue={0}/></label><button className="button" disabled={!enabled}>계좌 저장</button></form></section>
        <MonthClose data={data} enabled={enabled} save={save}/><CategoryEditor data={data} enabled={enabled} save={save}/>
        <section className="panel detail-body"><h2>연도 마감</h2><p>전표와 계좌 잔액을 확인한 뒤 마감합니다. 마감하면 해당 연도의 입력이 잠깁니다.</p><form onSubmit={e => formAction(e, f => ({ action: data.closed ? 'YEAR_REOPEN' : 'YEAR_CLOSE', reason: f.get('reason') }))}><label>사유<input name="reason" maxLength={300} required/></label><button className="button" disabled={busy || !data.version}>{data.closed ? '마감 해제' : `${year}년 마감`}</button></form></section>
        <section className="panel detail-body"><h2>최근 처리 이력</h2><ul>{data.events.map((event, index) => <li key={index}>{new Date(event.at).toLocaleString('ko-KR')} · {event.action}<small>{event.reason}</small></li>)}</ul></section>
      </div>}
      {activeTab === 'access' && data.canManageAccess && <section className="panel detail-body"><h2>재정 접근 권한</h2><p>기존 가입 계정의 이메일로 권한을 지정합니다. 헌금자별 내역은 재정 책임자·입력 담당·감사만 열람합니다. 결산 요약 역할에는 개인별 내역이 제공되지 않습니다.</p><div className="finance-table"><table><thead><tr><th>계정</th><th>역할</th><th>상태</th></tr></thead><tbody>{data.grants.map(g => <tr key={g.email}><td>{g.email}</td><td>{financeRoles[g.role]}</td><td>{g.active ? '사용' : '중지'}</td></tr>)}</tbody></table></div><form className="finance-form" onSubmit={e => formAction(e, f => { const email = String(f.get('email')).trim().toLowerCase(); return { action: 'ACCESS_SAVE', email, role: f.get('role'), active: f.get('active') === 'true', version: data.grants.find(g => g.email.toLowerCase() === email)?.version ?? 0, reason: f.get('reason'), password: f.get('password') }; })}><label>가입 이메일<input name="email" type="email" autoComplete="off" required/></label><label>재정 역할<select name="role">{Object.entries(financeRoles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>접근 상태<select name="active"><option value="true">사용</option><option value="false">중지</option></select></label><label>변경 사유<input name="reason" required maxLength={300}/></label><label>현재 관리자 비밀번호<input name="password" type="password" autoComplete="current-password"/><small>2단계 인증을 완료한 세션에서는 생략할 수 있습니다.</small></label><button className="button primary" disabled={busy}>권한 저장</button></form></section>}
    </>}
  </div></div></section>;
}

function GivingReport({ data, partyName, download }: { data: FinanceSnapshot; partyName: (entry: FinanceEntry) => string; download: (rows: (string | number)[][], name: string) => void }) {
  const [member, setMember] = useState('');
  const rows = data.entries.filter(e => e.status === 'POSTED' && e.kind === 'INCOME' && data.categories.some(c => c.id === e.categoryId && c.offering) && (!member || e.memberId === member));
  const columns = [['날짜', '헌금자', '항목', '금액'], ...rows.map(e => [e.date, partyName(e), data.categories.find(c => c.id === e.categoryId)?.name ?? '', e.amount])];
  return <section className="panel detail-body finance-print"><div className="finance-actions"><h2>{data.year}년 헌금 내역</h2><label>교인 선택<select value={member} onChange={e => setMember(e.target.value)}><option value="">전체 헌금</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label><button className="button" onClick={() => window.print()}>인쇄</button><button className="button" onClick={() => download(columns, '헌금내역')}>CSV 내려받기</button></div><p>{rows.length}건 · 합계 {won(rows.reduce((sum, e) => sum + e.amount, 0))}</p><p>교회 내부 확인용 내역입니다. 세무용 기부금영수증은 별도 발급 절차를 거칩니다.</p><div className="finance-table"><table><thead><tr>{columns[0].map((value, i) => <th key={i}>{value}</th>)}</tr></thead><tbody>{columns.slice(1).map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{j === 3 ? won(Number(value)) : value}</td>)}</tr>)}</tbody></table></div></section>;
}
