'use client';
import {useState} from 'react';
import type {FinanceSnapshot} from '@daegwang/contracts/finance';
export function MoneyAccounts({data,enabled,save}:{data:FinanceSnapshot;enabled:boolean;save:(p:Record<string,unknown>)=>Promise<boolean>}){
  const [mode,setMode]=useState<string|null>(null);
  const [newId,setNewId]=useState('');
  const current=data.accounts.find(a=>a.id===mode);
  return <section className="panel detail-body"><h2>통장·현금 관리</h2>
    {data.accounts.map(a=><div key={a.id} className="finance-line"><div>{a.name}<small>연초 {a.opening.toLocaleString()}원</small></div><strong>{a.balance.toLocaleString()}원</strong><button className="button" disabled={!enabled} onClick={()=>setMode(a.id)}>수정</button></div>)}
    <div className="finance-actions"><button className="button" disabled={!enabled} onClick={()=>{setNewId(crypto.randomUUID());setMode('bank')}}>통장 추가</button><button className="button" disabled={!enabled} onClick={()=>{setNewId(crypto.randomUUID());setMode('cash')}}>현금함 추가</button></div>
    {mode&&<form key={mode} className="finance-form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(await save({action:'ACCOUNT_SAVE',id:current?.id??newId,name:f.get('name'),opening:Number(f.get('opening'))}))setMode(null)}}>
    <label>통장·현금함 이름<input required maxLength={100} name="name" defaultValue={current?.name??(mode==='cash'?'현금 시재':'')} /></label>
    <label>연초 기초잔액 · 원<input required type="number" min={0} max={1e12} step={1} name="opening" defaultValue={current?.opening??0}/></label>
    <p>연중에 통장에서 인출한 돈은 기초잔액에 더하지 않고 ‘현금 인출·이체’로 현금함에 옮기세요.</p>
    <div><button className="button primary" disabled={!enabled}>저장</button> <button type="button" className="button" onClick={()=>setMode(null)}>닫기</button></div></form>}
  </section>;
}
