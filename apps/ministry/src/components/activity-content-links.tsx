'use client';
import {useEffect,useState} from 'react';
import {eventPageSchema} from '@daegwang/contracts/features/events/app-contract';
import {noticePageSchema} from '@daegwang/contracts/features/notices/app-contract';
import type {MinistryContentLink} from '@daegwang/contracts/ministry-content-links';
const key=(row:MinistryContentLink)=>`${row.kind}:${row.id}`;
const api='https://daegwangchurch-admin.vercel.app/api/v1';
export function ActivityContentLinks({value,onChange,month}:{value:MinistryContentLink[];onChange:(value:MinistryContentLink[])=>void;month:string}){
 const [expanded,setExpanded]=useState(false);const [kind,setKind]=useState<'EVENT'|'NOTICE'>('EVENT');const [selectedMonth,setSelectedMonth]=useState(month);const [page,setPage]=useState(0);
 const [rows,setRows]=useState<{id:string;title:string}[]>([]);const [next,setNext]=useState<number|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [titles,setTitles]=useState<Record<string,string>>({});const [reload,setReload]=useState(0);
 useEffect(()=>{
  if(!expanded)return;const controller=new AbortController();
  async function load(){setBusy(true);setError('');try{
   const query=new URLSearchParams({page:String(page),...(kind==='EVENT'?{month:selectedMonth}:{})});
   const r=await fetch(`${api}/${kind==='EVENT'?'events':'notices'}?${query}`,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!r.ok)throw new Error();
   const data=(kind==='EVENT'?eventPageSchema:noticePageSchema).parse(await r.json());if(controller.signal.aborted)return;
   setRows(data.data);setNext(data.nextPage);setTitles(old=>({...old,...Object.fromEntries(data.data.map(row=>[`${kind}:${row.id}`,row.title]))}));
  }catch{if(!controller.signal.aborted){setRows([]);setNext(null);setError('공개 자료를 불러오지 못했습니다. 기존 연결은 유지됩니다.');}}finally{if(!controller.signal.aborted)setBusy(false);}}
  void load();return ()=>controller.abort();
 },[expanded,kind,page,selectedMonth,reload]);
 useEffect(()=>{
  if(!expanded)return;const missing=value.filter(row=>!titles[key(row)]);if(!missing.length)return;const controller=new AbortController();
  void Promise.all(missing.map(async row=>{
   try{const r=await fetch(`${api}/${row.kind==='EVENT'?'events':'notices'}/${encodeURIComponent(row.id)}`,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!r.ok)throw new Error();const json=await r.json();return [key(row),typeof json.data?.title==='string'?json.data.title:'연결된 게시물'] as const;}
   catch{return [key(row),'현재 공개 정보를 확인할 수 없는 연결'] as const;}
  })).then(found=>{if(!controller.signal.aborted)setTitles(old=>({...old,...Object.fromEntries(found)}));});
  return ()=>controller.abort();
 },[expanded,value,titles]);
 return <details onToggle={e=>setExpanded(e.currentTarget.open)}><summary>관련 교회 일정·공지 {value.length>0&&`· ${value.length}개 연결`}</summary><p className="muted">공개된 게시물을 연결합니다. 내부 목회 내용은 홈페이지·앱으로 복사되지 않습니다. 최대 20개까지 연결할 수 있습니다.</p>
  {value.length>0&&<ul className="history-list">{value.map(row=><li key={key(row)}><span>{row.kind==='EVENT'?'일정':'공지'} · {titles[key(row)]??'연결 정보 확인 중…'}</span> <button type="button" className="button" onClick={()=>onChange(value.filter(v=>key(v)!==key(row)))}>연결 해제</button></li>)}</ul>}
  <div className="chips"><label>자료 종류<select value={kind} onChange={e=>{setKind(e.target.value as 'EVENT'|'NOTICE');setPage(0);}}><option value="EVENT">교회 일정</option><option value="NOTICE">공지사항</option></select></label>{kind==='EVENT'&&<label>일정 월<input type="month" value={selectedMonth} onChange={e=>{if(e.target.value){setSelectedMonth(e.target.value);setPage(0);}}}/></label>}<button type="button" className="button" onClick={()=>setReload(n=>n+1)}>목록 새로고침</button></div>
  {busy?<p role="status">공개 자료를 불러오는 중…</p>:error?<p role="status">{error}</p>:<><div className="batch-candidates">{rows.map(row=>{const checked=value.some(v=>v.kind===kind&&v.id===row.id);return <label key={row.id}><input type="checkbox" checked={checked} disabled={!checked&&value.length>=20} onChange={e=>onChange(e.target.checked?[...value,{kind,id:row.id}]:value.filter(v=>v.kind!==kind||v.id!==row.id))}/>{row.title}</label>;})}</div>{!rows.length&&<p>현재 목록에 공개된 자료가 없습니다.</p>}<div className="chips">{page>0&&<button type="button" className="button" onClick={()=>setPage(n=>n-1)}>이전 자료</button>}{next!==null&&<button type="button" className="button" onClick={()=>setPage(next)}>다음 자료</button>}</div></>}
 </details>;
}
