'use client';

import {financeHref,financeTab} from '../lib/finance-routes';
import {FinanceAudit} from './finance-audit';
import {MoneyAccounts} from './finance-money-accounts';
import {RepeatPayment} from './finance-repeat-payment';
import { PeriodPicker, type Period } from './finance-period';
import {MonthClose, CategoryEditor} from './finance-controls';
import { GiftSource,PaperDesk } from './finance-paper-desk';
import {groupedAccounts} from './finance-account-groups';
import { MeetingReport } from './finance-meeting-report';
import {GivingReport} from './finance-giving-report';
import { FinanceTax } from './finance-tax';
import { LogoutButton } from './logout-button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { financeCsv, financeRoles, financeTotals, type FinanceEntry, type FinanceSnapshot } from '@daegwang/contracts/finance';

const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;
const today = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const kinds = { INCOME: '수입 · 헌금', EXPENSE: '지출', TRANSFER: '계좌 이체' };
const workflows = {
  gift:{label:'헌금 입력',kind:'INCOME'}, income:{label:'기타 수입 입력',kind:'INCOME'},
  expense:{label:'지출 입력',kind:'EXPENSE'}, transfer:{label:'현금 인출·이체',kind:'TRANSFER'},
} as const;
type Workflow=keyof typeof workflows;
const states = { DRAFT: '승인 대기', POSTED: '집행 완료', VOID: '취소' };
const tabs = [
  {id:'overview', title:'재정 현황', group:'장부'},
  {id:'entries', title:'수입·지출 장부', group:'장부'},
  {id:'giving', title:'헌금 내역 조회', group:'헌금·세무'},
  {id:'tax', title:'기부금영수증', group:'헌금·세무'},
  {id:'payroll', title:'목회자 사례비', group:'헌금·세무'},
  {id:'budget', title:'예산·결산', group:'장부'},
  {id:'accounts', title:'통장·현금 관리', group:'재정 설정'},
  {id:'categories', title:'계정과목·헌금 종류', group:'재정 설정'},
  {id:'access', title:'사용자 권한', group:'재정 설정'},
  {id:'audit', title:'처리 이력', group:'재정 설정'},
] as const;
type Tab = typeof tabs[number]['id'];
const annualTabs:readonly Tab[]=['audit','accounts','categories','access'];


export function FinanceWorkspace({ministryUrl,initialTab='overview',customHost=false,initialData,initialError}:{ministryUrl:string;initialTab?:Tab;customHost?:boolean;initialData?:FinanceSnapshot;initialError?:string}) {
  const [year, setYear] = useState(initialData?.year??Number(today().slice(0, 4)));
  const [data, setData] = useState<FinanceSnapshot | null>(initialData??null);
  const [menuOpen,setMenuOpen]=useState(false);
  const menuToggle=useRef<HTMLButtonElement>(null);
  const [tab, showTab] = useState<Tab>(initialTab);
  function setTab(next:Tab){
    const href=financeHref(next,customHost);
    if(window.location.pathname!==href)window.history.pushState(null,'',href);
    showTab(next);
  }
  useEffect(()=>{
    const restore=()=>{showTab(financeTab(window.location.pathname)??'overview');setMenuOpen(false);setEditing(null);setClosingOpen(false);setReview(null);};
    window.addEventListener('popstate',restore);
    return ()=>window.removeEventListener('popstate',restore);
  },[]);
  const [period, setPeriod] = useState<Period | null>(null);
  const [closeLevel,setCloseLevel]=useState<'month'|'year'>('month');
  const [closingOpen, setClosingOpen] = useState(false);
  const annualView = annualTabs.includes(tab) || (tab === 'budget' && closingOpen);
  const range = annualView ? null : period;
  const periodQuery = range ? '&'+new URLSearchParams(range).toString() : '';
  const periodLabel = range ? range.start+' ~ '+range.end : year+'년 전체';
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(!initialData&&!initialError);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError??'');
  const [notice, setNotice] = useState('');
  const [flow,setFlow]=useState<Workflow>('gift');
  const [editing, setEditing] = useState<FinanceEntry | null>(null);
  const [review, setReview] = useState<FinanceEntry | null>(null);
  const [query, setQuery] = useState('');
  const [accountFilter,setAccountFilter] = useState('ALL');
  const [statement,setStatement] = useState('');
  const [entryKind,setEntryKind]=useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const loadedKey=useRef(initialData?String(initialData.year):'');
  const initialYear=useRef(initialData?.year??(initialError?year:undefined));
  const lock = useRef(false);
  const pending = useRef<{ signature: string; id: string } | null>(null);
  useEffect(() => {
    if(initialYear.current===year && !reload && !periodQuery)return;
    initialYear.current=undefined;
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/v1/finance?year=${year}${periodQuery}`, { cache: 'no-store', signal: controller.signal });
        const value = await response.json();
        if (!response.ok) throw new Error(value.message);
        if (!controller.signal.aborted) { loadedKey.current=String(year)+periodQuery; setData(value); }
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
  const visibleTabs = tabs.filter(item => item.id === 'access' ? data?.canManageAccess : item.id==='audit' ? manager || data?.role==='AUDITOR' : ['accounts','categories','tax','payroll'].includes(item.id) ? manager : ['entries', 'giving'].includes(item.id) ? detail : !!data?.role);
  const totals = data ? financeTotals(data) : { income: 0, expense: 0, budget: 0, balance: 0 };
  const indexes=useMemo(()=>({
    accounts:new Map(data?.accounts.map(a=>[a.id,a.name])),categories:new Map(data?.categories.map(c=>[c.id,c.name])),members:new Map(data?.members.map(m=>[m.id,m.name]))
  }),[data]);
  const accountName = (id: string | null) => indexes.accounts.get(id??'') ?? '';
  const categoryName = (id: string | null) => indexes.categories.get(id??'') ?? '계좌 이체';
  const partyName = (entry: FinanceEntry) => (indexes.members.get(entry.memberId??'') ?? entry.party) || '무명';
  const filtered = activeTab!=='entries'||editing?[]:data?.entries.filter(entry => (accountFilter==='ALL'||entry.accountId===accountFilter||entry.destinationId===accountFilter) && (entryKind==='ALL'||entry.kind===entryKind) && (status === 'ALL' || entry.status === status) && (!query.trim() || `${entry.date} ${partyName(entry)} ${entry.memo} ${categoryName(entry.categoryId)} ${entry.receipt}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))) ?? [];
  function download(rows: (string | number)[][], name: string) {
    const url = URL.createObjectURL(new Blob([financeCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${periodLabel}-${name}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function choices(type:Workflow) {
    return data?.categories.filter(c=>c.active!==false && c.kind===workflows[type].kind && (c.kind!=='INCOME' || c.offering===(type==='gift'))) ?? [];
  }
  const [repeatOnStart,setRepeatOnStart]=useState(false);
  function newEntry(type:Workflow,repeat=false) {
    setRepeatOnStart(repeat);
    if(!data)return;
    setFlow(type);setTab('entries');setMenuOpen(false);setReview(null);
    setAccountFilter('ALL');setStatement('');setStatus('ALL');setQuery('');setEntryKind('ALL');setPage(0);setNotice('');setError('');
    const date=range ? (range.start<=today() && today()<=range.end ? today() : range.start) : year===Number(today().slice(0,4))?today():year+'-01-01';
    setEditing({id:crypto.randomUUID(),date,kind:workflows[type].kind,accountId:data.accounts[0]?.id??'',destinationId:type==='transfer'?data.accounts[1]?.id??null:null,categoryId:choices(type)[0]?.id??null,amount:0,memberId:null,party:'',memo:'',receipt:'',status:'DRAFT',createdBy:'',approvedBy:null});
  }
  function editEntry(entry:FinanceEntry) {
    setFlow(entry.kind==='EXPENSE'?'expense':entry.kind==='TRANSFER'?'transfer':data?.categories.some(c=>c.id===entry.categoryId && c.offering)?'gift':'income');
    setRepeatOnStart(false);setEditing(entry);
  }
  return <section className="finance-page">
    <div className="finance-layout">
      <aside className="finance-rail">
        <div className="finance-brand"><div><small>대한예수교장로회 대광교회</small><strong>재정 관리</strong></div>
          <button className="finance-menu-toggle" ref={menuToggle} aria-expanded={menuOpen} aria-controls="finance-navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?'메뉴 닫기':'재정 메뉴'}</button></div>
        <div id="finance-navigation" className={menuOpen?'finance-rail-body is-open':'finance-rail-body'} onKeyDown={e=>{if(e.key==='Escape'){setMenuOpen(false);menuToggle.current?.focus();}}}>
          <nav className="finance-tabs" aria-label="재정 업무">{Array.from(new Set(visibleTabs.map(item=>item.group))).map(group=><div className="finance-nav-group" key={group}><p>{group}</p>{visibleTabs.filter(item=>item.group===group).map(item=><a key={item.id} href={financeHref(item.id,customHost)} aria-disabled={busy || !!editing} aria-current={activeTab===item.id?'page':undefined} onClick={e=>{if(busy||editing){e.preventDefault();return;}if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();setClosingOpen(false);setTab(item.id);setReview(null);setMenuOpen(false);if(menuOpen)menuToggle.current?.focus();}}>{item.title}</a>)}</div>)}</nav>
          <div className="finance-rail-links"><a href={ministryUrl}>목회시스템으로 돌아가기</a><LogoutButton/></div>
        </div>
      </aside>
      <div className="finance-content">
    <header className="finance-command"><div><h1>{editing?workflows[flow].label:tabs.find(item=>item.id===activeTab)?.title??'재정 관리'}</h1>{data && <p className="finance-role">{data.role ? financeRoles[data.role] : '재정 권한 지정'} · {data.version ? data.closed ? '마감된 연도' : '장부 작성 중' : '회계연도 개설 전'}</p>}</div><div className="finance-command-filters"><label>회계연도<select value={year} disabled={busy || !!editing} onChange={event => { setAccountFilter('ALL');setStatement('');setPeriod(null); setYear(Number(event.target.value)); setData(null); setPage(0); setReview(null); }}>{Array.from(new Set([...(data?.years ?? []), ...Array.from({ length: Number(today().slice(0, 4)) + 6 - 2000 }, (_, index) => 2000 + index)])).sort((a, b) => b - a).map(value => <option key={value}>{value}</option>)}</select></label>{!editing&&data?.role&&!annualView&&<PeriodPicker key={year} year={year} value={period} disabled={busy || !!editing} onChange={next=>{setStatement('');setPeriod(next);setReview(null);setPage(0);}}/>}</div></header>
    {data?.role&&!annualView&&<p className="finance-print-period">{periodLabel}</p>}
    {loading && <p role="status">재정 자료를 불러오는 중…</p>}
    {error && <div className="finance-error" role="alert"><p>{error}</p><button className="button" disabled={busy} onClick={() => setReload(value => value + 1)}>새로고침</button> <a href={'/login?next='+encodeURIComponent(financeHref(tab,customHost))}>다시 로그인</a></div>}
    {data && !visibleTabs.some(item=>item.id===activeTab) && <p role="alert">이 메뉴를 열람할 재정 권한이 없습니다.</p>}
    {notice&&<p role="status">{notice}</p>}
    {data && loadedKey.current===String(year)+periodQuery && <>
      {data.role && !data.version && <div className="panel detail-body"><h2>{year}년 장부를 시작하세요</h2><p>재정 책임자가 회계연도를 개설하고 입출금 계좌의 기초잔액을 입력하면 기록할 수 있습니다.</p>{manager && <form onSubmit={e => formAction(e, f => ({ action: 'YEAR_CREATE', carry: f.get('carry') === 'on' }))}><label className="check"><input type="checkbox" name="carry" defaultChecked={data.years.includes(year-1)}/>전년도 마감 잔액·항목·예산을 이어받기</label><button className="button primary" disabled={busy}>회계연도 개설</button></form>}</div>}
      {writer && !editing && (activeTab==='overview' || activeTab==='entries') && <section className="finance-entry-start panel">
        <h2>거래 입력</h2>
        <div className="finance-actions">{(Object.keys(workflows) as Workflow[]).map(type=><button key={type} className="button" disabled={!enabled || !data.accounts.length || (type==='transfer' && data.accounts.length<2)} onClick={()=>newEntry(type)}>{workflows[type].label}</button>)}<button type="button" className="button" disabled={!enabled||!data.accounts.length} onClick={()=>newEntry('expense',true)}>지난 거래로 입력</button></div>
        {data.closed?<p>마감한 회계연도입니다.</p>:!data.version?<p>먼저 회계연도를 개설하세요.</p>:!data.accounts.length?<p>첫 거래를 입력하려면 입출금 계좌가 필요합니다. {manager?<button className="button" onClick={()=>setTab('accounts')}>통장·현금함 등록</button>:'재정 책임자에게 계좌 등록을 요청하세요.'}</p>:null}
      </section>}
      {activeTab === 'overview' && data.role && <>
        <div className="finance-metrics">{[['전기 이월', totals.balance-totals.income+totals.expense],['수입 합계', totals.income], ['지출 합계', totals.expense], ['기간 말 잔액', totals.balance]].map(([label, value]) => <article className="panel" key={label}><span>{label}</span><strong>{won(Number(value))}</strong></article>)}</div>
        <div className="finance-columns"><section className="panel detail-body"><h2>기간 말 통장·현금 잔액</h2>{data.accounts.map(account => <div className="finance-line" key={account.id}><span>{account.name}</span><strong>{won(account.balance)}</strong></div>)}{!data.accounts.length && <p>등록된 계좌가 없습니다.</p>}</section><section className="panel detail-body"><h2>기간 집행 / 연간 예산</h2>{data.categories.filter(c => c.kind === 'EXPENSE').map(category => <div className="finance-progress" key={category.id}><div className="finance-line"><span>{category.name}</span><strong>{category.budget ? Math.round(category.actual / category.budget * 100) : category.actual ? '예산 미등록' : 0}{category.budget ? '%' : ''}</strong></div><progress aria-label={`${category.name} 집행률`} max={Math.max(category.budget, category.actual, 1)} value={category.actual}/><small>{won(category.actual)} / {won(category.budget)}{category.actual > category.budget && ' · 예산 초과'}</small></div>)}</section></div>
        {detail && data.entries.some(e=>e.status==='DRAFT') && <section className="panel detail-body"><h2>기존 미처리 전표 {data.entries.filter(e => e.status === 'DRAFT').length}건</h2><p>승인된 전표가 수입·지출과 잔액에 반영됩니다. 계좌 간 이체는 수입·지출 합계에서 제외됩니다.</p><button className="button" onClick={() => { setEntryKind('ALL');setQuery('');setPage(0);setAccountFilter('ALL');setStatement('');setStatus('DRAFT'); setTab('entries'); }}>승인 대기 확인</button></section>}
      </>}
      {activeTab === 'entries' && detail && <>
        {editing ? <form className="panel detail-body" onSubmit={event => { event.preventDefault(); void save({ action: 'ENTRY_RECORD', ...Object.fromEntries(Object.entries(editing).filter(([key]) => !['status', 'createdBy', 'approvedBy'].includes(key))) }).then(saved => { if (saved) { setEditing(null);setTab('overview');setNotice('저장했습니다. 장부와 잔액에 반영했습니다.'); } }); }}>
          <h2>{workflows[flow].label}</h2>
          {(flow==='income'||flow==='expense')&&!data.entries.some(e=>e.id===editing.id)&&<RepeatPayment initialOpen={repeatOnStart} data={data} annual={!range} onPick={r=>{
            const next=r.kind==='INCOME'?'income':'expense';setFlow(next);
            setEditing({...editing,kind:r.kind,amount:r.amount,memo:r.memo,party:r.party,receipt:'',memberId:null,destinationId:null,
              accountId:data.accounts.some(a=>a.id===r.accountId)?r.accountId:'',
              categoryId:choices(next).some(c=>c.id===r.categoryId)?r.categoryId:null});
          }}/>}
          {flow==='transfer'&&<p>출금한 통장과 돈을 받은 현금함을 선택하세요. 인출은 자금 이동으로 기록되고, 현금을 실제로 사용할 때 지출을 입력합니다.</p>}
          <fieldset disabled={busy || data.closed} className="finance-form">
            <label>입력 구분<select value={flow} onChange={e=>{const next=e.target.value as Workflow;setFlow(next);setEditing({...editing,kind:workflows[next].kind,memberId:null,party:'',categoryId:choices(next)[0]?.id??null,destinationId:next==='transfer'?data.accounts.find(a=>a.id!==editing.accountId)?.id??null:null});}}>{(Object.keys(workflows) as Workflow[]).map(k=><option key={k} value={k}>{workflows[k].label}</option>)}</select></label>
            <label>거래일<input type="date" required min={`${year}-01-01`} max={`${year}-12-31`} value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })}/></label>
            <label>{editing.kind === 'INCOME' ? '돈을 받은 통장·현금함' : '돈이 나간 통장·현금함'}<select required value={editing.accountId} onChange={e => setEditing({ ...editing, accountId: e.target.value, destinationId:editing.destinationId===e.target.value?null:editing.destinationId })}><option value="">계좌 선택</option>{data.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
            {editing.kind === 'TRANSFER' ? <label>돈을 받은 통장·현금함<select required value={editing.destinationId ?? ''} onChange={e => setEditing({ ...editing, destinationId: e.target.value })}><option value="">계좌 선택</option>{data.accounts.filter(a => a.id !== editing.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label> : <label>{flow==='gift'?'헌금 종류':flow==='expense'?'지출 항목':'수입 항목'}<select required value={editing.categoryId ?? ''} onChange={e => setEditing({ ...editing, categoryId: e.target.value })}><option value="">항목 선택</option>{groupedAccounts(choices(flow)).map(group=><optgroup key={group.name} label={group.name}>{group.items.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select></label>}
            {flow!=='transfer' && !choices(flow).length && <p role="status">사용 가능한 항목이 없습니다. {manager?<button type="button" className="button" onClick={()=>{setEditing(null);setTab('categories');}}>계정과목 설정으로 이동</button>:'재정 책임자에게 항목 등록을 요청하세요.'}</p>}
            <label>금액 · 원<input type="number" min={1} max={1_000_000_000_000} step={1} required value={editing.amount || ''} onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })}/></label>
            {flow==='gift' && <GiftSource key={editing.id} data={data} entry={editing} change={setEditing}/>}
            {flow!=='gift' && !!editing.memberId && <label>헌금자 · 교적 연결<select value={editing.memberId ?? ''} onChange={e => setEditing({ ...editing, memberId: e.target.value || null, party: '' })}><option value="">무명 또는 직접 입력</option>{data.members.map(m => <option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label>}
            {flow!=='gift' && !editing.memberId && <label>{flow === 'expense' ? '지급처' : flow==='income'?'입금처':'거래처 · 선택'}<input maxLength={100} value={editing.party} onChange={e => setEditing({ ...editing, party: e.target.value })}/></label>}
            <label>적요<input maxLength={1000} required value={editing.memo} onChange={e => setEditing({ ...editing, memo: e.target.value })}/></label>
            <label className="finance-wide">증빙번호 · 영수증 보관 위치<input maxLength={300} value={editing.receipt} onChange={e => setEditing({ ...editing, receipt: e.target.value })}/><small>통장 거래번호 또는 별도로 보관한 증빙의 위치를 적으세요.</small></label>
          </fieldset><div className="finance-actions"><button className="button primary" disabled={busy || data.closed}>저장하고 장부에 반영</button><button className="button" type="button" disabled={busy} onClick={() => setEditing(null)}>목록으로</button></div>
        </form> : <>
          <div className="finance-actions"><select aria-label="입출금 계좌 필터" value={accountFilter} onChange={e=>{setAccountFilter(e.target.value);setStatement('');setPage(0)}}><option value="ALL">모든 계좌</option>{data.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><input aria-label="장부 검색" placeholder="헌금자·적요·항목 검색" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/><select aria-label="거래 종류" value={entryKind} onChange={e=>{setEntryKind(e.target.value);setPage(0);}}><option value="ALL">모든 거래</option>{Object.entries(kinds).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select aria-label="처리 상태" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="ALL">전체 상태</option>{Object.entries(states).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button className="button" onClick={() => download([['날짜', '종류', '항목', '계좌', '이름·지급처', '금액', '적요', '증빙', '상태'], ...filtered.map(e => [e.date, kinds[e.kind], categoryName(e.categoryId), accountName(e.accountId), partyName(e), e.amount, e.memo, e.receipt, states[e.status]])], '장부')}>CSV 내려받기</button></div>
          {accountFilter!=='ALL'&&<details className="finance-edit-panel"><summary>통장·현금 잔액 대조</summary><p>{periodLabel} · 기간 말 장부 잔액 {won(data.accounts.find(a=>a.id===accountFilter)?.balance??0)}</p><label>같은 종료일의 통장 잔액·보유 현금 · 원<input type="number" step="1" value={statement} onChange={e=>setStatement(e.target.value)}/></label>{statement!==''&&<p role="status">실제 − 장부 차액 {won(Number(statement)-(data.accounts.find(a=>a.id===accountFilter)?.balance??0))}</p>}</details>}
          {review && <form className="panel detail-body" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value'); void save({ action, id: review.id, reason: String(form.get('reason')) }).then(saved => { if (saved) setReview(null); }); }}><h2>{review.date} · {categoryName(review.categoryId)} · {won(review.amount)}</h2><p>{review.memo} · {partyName(review)}</p>{review.kind === 'EXPENSE' && <p>항목 예산 {won(data.categories.find(c => c.id === review.categoryId)?.budget ?? 0)} · 현재 집행 {won(data.categories.find(c => c.id === review.categoryId)?.actual ?? 0)}</p>}<label>승인·취소 사유<input name="reason" required maxLength={300}/></label><div className="finance-actions">{review.status === 'DRAFT' && <button value="ENTRY_POST" className="button primary" disabled={!enabled}>승인 · 집행 반영</button>}<button value="ENTRY_VOID" className="button" disabled={!enabled}>전표 취소</button><button type="button" className="button" disabled={busy} onClick={() => setReview(null)}>닫기</button></div></form>}
          <div className="finance-table"><table><thead><tr><th>날짜·상태</th><th>항목·적요</th><th>계좌</th><th>헌금자·지급처</th><th>금액</th><th>처리</th></tr></thead><tbody>{filtered.slice(page * 20, page * 20 + 20).map(entry => <tr key={entry.id}><td>{entry.date}<small>{states[entry.status]}</small></td><td>{categoryName(entry.categoryId)}<small>{entry.memo}</small>{entry.receipt && <small>증빙 {entry.receipt}</small>}</td><td>{accountName(entry.accountId)}{entry.destinationId && ` → ${accountName(entry.destinationId)}`}</td><td>{partyName(entry)}</td><td>{won(entry.amount)}</td><td>{writer && entry.status === 'DRAFT' && <button className="button" disabled={!enabled} onClick={() => editEntry(entry)}>수정</button>}{manager && entry.status !== 'VOID' && <button className="button" disabled={!enabled} onClick={() => setReview(entry)}>{entry.status==='DRAFT'?'처리하기':'거래 취소'}</button>}</td></tr>)}</tbody></table>{!filtered.length && <p>조건에 맞는 전표가 없습니다.</p>}</div><div className="finance-actions"><span>{filtered.length}건 · {page + 1}페이지</span><button className="button" disabled={!page} onClick={() => setPage(page - 1)}>이전</button><button className="button" disabled={(page + 1) * 20 >= filtered.length} onClick={() => setPage(page + 1)}>다음</button></div>
        </>}
      </>}
      {activeTab==='tax' && manager && <PaperDesk key={periodLabel} data={data} save={save}/>}
      {activeTab === 'payroll' && manager && <FinanceTax key={periodLabel} data={data} download={download}/>} 
      {activeTab === 'giving' && detail && <GivingReport key={periodLabel} period={periodLabel} data={data} download={download}/>}
      {activeTab === 'budget' && data.role && (closingOpen && manager ? <section>
        <button className="button" onClick={()=>setClosingOpen(false)}>← 결산으로 돌아가기</button>
        <h2>장부 마감</h2><div className="finance-view-switch" aria-label="마감 단위"><button className="button" aria-pressed={closeLevel==='month'} onClick={()=>setCloseLevel('month')}>월 마감</button><button className="button" aria-pressed={closeLevel==='year'} onClick={()=>setCloseLevel('year')}>연도 마감</button></div>{closeLevel==='month'?<MonthClose initialMonth={period ? Number(period.end.slice(5,7)) : undefined} data={data} enabled={enabled} save={save}/>:<section className="panel detail-body"><h2>연도 마감</h2><p>전표와 계좌 잔액을 확인한 뒤 마감합니다. 마감하면 해당 연도의 입력이 잠깁니다.</p><form onSubmit={e => formAction(e, f => ({ action: data.closed ? 'YEAR_REOPEN' : 'YEAR_CLOSE', reason: f.get('reason') }))}><label>사유<input name="reason" maxLength={300} required/></label><button className="button" disabled={busy || !data.version}>{data.closed ? '마감 해제' : `${year}년 마감`}</button></form></section>}
      </section> : <MeetingReport key={year} data={data} period={periodLabel} range={range} enabled={enabled} save={save} editAccounts={()=>setTab('categories')} closeBooks={()=>{setCloseLevel('month');setClosingOpen(true)}} download={download}/> )}
      {activeTab==='accounts' && manager && <MoneyAccounts data={data} enabled={enabled} save={save}/>}
      {activeTab==='categories' && manager && <CategoryEditor data={data} enabled={enabled} save={save}/>}
      {activeTab==='audit' && (manager || data.role==='AUDITOR') && <FinanceAudit key={year} events={data.events}/>}
      {activeTab === 'access' && data.canManageAccess && <section className="panel detail-body"><h2>재정 접근 권한</h2><p>기존 가입 계정의 이메일로 권한을 지정합니다. 헌금자별 내역은 재정 책임자·입력 담당·감사만 열람합니다. 결산 요약 역할에는 개인별 내역이 제공되지 않습니다.</p><div className="finance-table"><table><thead><tr><th>계정</th><th>역할</th><th>상태</th></tr></thead><tbody>{data.grants.map(g => <tr key={g.email}><td>{g.email}</td><td>{financeRoles[g.role]}</td><td>{g.active ? '사용' : '중지'}</td></tr>)}</tbody></table></div><details className="finance-edit-panel finance-no-print"><summary>사용자 권한 설정</summary><form className="finance-form" onSubmit={e => formAction(e, f => { const email = String(f.get('email')).trim().toLowerCase(); return { action: 'ACCESS_SAVE', email, role: f.get('role'), active: f.get('active') === 'true', version: data.grants.find(g => g.email.toLowerCase() === email)?.version ?? 0, reason: f.get('reason'), password: f.get('password') }; })}><label>가입 이메일<input name="email" type="email" autoComplete="off" required/></label><label>재정 역할<select name="role">{Object.entries(financeRoles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>접근 상태<select name="active"><option value="true">사용</option><option value="false">중지</option></select></label><label>변경 사유<input name="reason" required maxLength={300}/></label><label>현재 관리자 비밀번호<input name="password" type="password" autoComplete="current-password"/><small>2단계 인증을 완료한 세션에서는 생략할 수 있습니다.</small></label><button className="button primary" disabled={busy}>권한 저장</button></form></details></section>}
    </>}
  </div></div></section>;
}
