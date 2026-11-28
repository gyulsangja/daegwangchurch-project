'use client';
import {useEffect,useMemo,useState} from 'react';
import type {FinanceSnapshot,FinanceEntry} from '@daegwang/contracts/finance';

type RepeatRow=Pick<FinanceEntry,'kind'|'accountId'|'categoryId'|'amount'|'party'|'memo'|'date'>;
export function RepeatPayment({data,annual,onPick,initialOpen}:{initialOpen:boolean;data:FinanceSnapshot;annual:boolean;onPick:(row:RepeatRow)=>void}){
  const [open,setOpen]=useState(initialOpen),[year,setYear]=useState(data.year),[query,setQuery]=useState('');
  const [response,setResponse]=useState<{year:number;rows:RepeatRow[]}|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  const local=annual&&year===data.year;
  useEffect(()=>{
    if(!open||local||response?.year===year)return;
    const cancel=new AbortController();setFailed(false);
    fetch('/api/v1/finance?year='+year+'&repeat=1',{signal:cancel.signal,cache:'no-store'}).then(async r=>{
      if(!r.ok)throw Error();return r.json() as Promise<RepeatRow[]>;
    }).then(rows=>{if(!cancel.signal.aborted)setResponse({year,rows})}).catch(()=>{if(!cancel.signal.aborted)setFailed(true)});
    return ()=>cancel.abort();
  },[open,local,year,response?.year,retry]);
  const rows=useMemo(()=>{
    if(!open)return [];
    const income=new Set(data.categories.filter(c=>c.kind==='INCOME'&&!c.offering).map(c=>c.id));
    const src=local?data.entries.filter(e=>e.status==='POSTED'&&(e.kind==='EXPENSE'||(e.kind==='INCOME'&&!e.memberId&&income.has(e.categoryId??'')))):response?.year===year?response.rows:[];
    const seen=new Set<string>();const search=query.trim().toLocaleLowerCase();
    const names=new Map(data.categories.map(c=>[c.id,c.name]));
    return [...src].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>{
      const key=JSON.stringify([r.kind,r.accountId,r.categoryId,r.party,r.memo]);
      if(seen.has(key)||!(r.party+' '+r.memo+' '+(names.get(r.categoryId??'')??'')).toLocaleLowerCase().includes(search))return false;
      seen.add(key);return true;
    }).slice(0,10);
  },[open,local,data.entries,data.categories,response,year,query]);
  return <details className="finance-edit-panel" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>지난 거래 불러오기</summary>{open&&<div>
    <div className="finance-actions"><label>거래 연도<select value={year} onChange={e=>setYear(Number(e.target.value))}>{[...new Set([data.year,...data.years])].sort((a,b)=>b-a).map(y=><option key={y}>{y}</option>)}</select></label>
    <label>거래 찾기<input type="search" onKeyDown={e=>{if(e.key==='Enter')e.preventDefault()}} placeholder="예: 대출이자, 임대료, 거래처" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    {!local&&response?.year!==year?<p role="status">{failed?'조회하지 못했습니다.':'거래를 찾는 중…'} {failed&&<button type="button" onClick={()=>setRetry(retry+1)}>다시 조회</button>}</p>:!rows.length?<p>일치하는 지출·기타 수입이 없습니다. 첫 거래는 아래에서 직접 입력하세요.</p>:<ul>{rows.map(r=><li key={JSON.stringify([r.kind,r.categoryId,r.accountId,r.party,r.memo])}><button type="button" className="button" onClick={()=>{onPick(r);setOpen(false)}}>{r.memo} · {r.amount.toLocaleString()}원 <small>{r.date} · {r.party||'거래처 미입력'}</small></button></li>)}</ul>}
    <p>최근 내역부터 최대 10개를 표시합니다. 불러온 뒤 이번 날짜와 금액을 확인하고 저장하세요.</p></div>}</details>;
}
