'use client';
import {useEffect,useMemo,useState} from 'react';
import {flushSync} from 'react-dom';
import type {FinanceSnapshot} from '@daegwang/contracts/finance';

type Choice={id:string;label:string};
type Directory={positions:Choice[];organizations:Choice[];members:{id:string;position:string;organizations:string[]}[]};
const kinds=['교인','가족','조직','직접 입력','무명'];
const won=(n:number)=>n.toLocaleString('ko-KR')+'원';
const normalized=(s:string)=>s.normalize('NFC').replace(/\s+/g,'').toLowerCase();
const pageSize=12;

function Choices({label,options,selected,change}:{label:string;options:Choice[];selected:string[];change:(ids:string[])=>void}){
  return <fieldset className="giving-choices"><legend>{label}</legend><div className="finance-actions">
    <button className="button" aria-pressed={!selected.length} onClick={()=>change([])}>전체</button>
    {options.map(o=><button className="button" key={o.id} aria-pressed={selected.includes(o.id)}
      onClick={()=>change(selected.includes(o.id)?selected.filter(id=>id!==o.id):[...selected,o.id])}>{o.label}</button>)}
  </div></fieldset>;
}

export function GivingReport({data,period,download}:{data:FinanceSnapshot;period:string;download:(rows:(string|number)[][],name:string)=>void}){
  const [categories,setCategories]=useState<string[]>([]),[types,setTypes]=useState<string[]>([]);
  const [positions,setPositions]=useState<string[]>([]),[groups,setGroups]=useState<string[]>([]);
  const [names,setNames]=useState<string[]>([]),[term,setTerm]=useState(''),[expanded,setExpanded]=useState(false);
  const [directory,setDirectory]=useState<Directory|null>(null),[error,setError]=useState(false),[attempt,retry]=useState(0);
  const [limit,setLimit]=useState(12),[page,setPage]=useState(0),[printing,setPrinting]=useState(false);
  useEffect(()=>{
    if(!expanded||directory)return;
    const controller=new AbortController();
    fetch('/api/v1/finance?givingDirectory=1&year='+data.year,{signal:controller.signal,cache:'no-store'})
      .then(async r=>{if(!r.ok)throw Error();return await r.json() as Directory;})
      .then(d=>{if(!controller.signal.aborted)setDirectory(d);})
      .catch(()=>{if(!controller.signal.aborted)setError(true);});
    return ()=>controller.abort();
  },[expanded,directory,data.year,attempt]);
  const options=useMemo(()=>data.categories.filter(c=>c.offering&&c.kind==='INCOME').map(c=>({id:c.id,label:c.name})),[data.categories]);
  const entries=useMemo(()=>{
    const members=new Map(data.members.map(m=>[m.id,m.name]));
    const category=new Map(options.map(o=>[o.id,o.label]));
    return data.entries.filter(e=>e.status==='POSTED'&&e.kind==='INCOME'&&category.has(e.categoryId??'')).map(e=>{
      const party=e.party.trim(),envelope=/^(가족|조직) · (.+)$/.exec(party);
      const kind=e.memberId?'교인':envelope?.[1]||(party?'직접 입력':'무명');
      const name=e.memberId?(members.get(e.memberId)||party||'교적 연결 명의'):envelope?.[2]||party||'무명';
      const key=e.memberId?'member:'+e.memberId:'party:'+party;
      return {e,kind,name,key,category:category.get(e.categoryId!)!};
    }).sort((a,b)=>b.e.date.localeCompare(a.e.date)||a.e.id.localeCompare(b.e.id));
  },[data.members,data.entries,options]);
  const assignments=useMemo(()=>new Map(directory?.members.map(m=>[m.id,m])),[directory]);
  const scoped=useMemo(()=>entries.filter(({e,kind})=>{
    const a=assignments.get(e.memberId??'');
    return (!categories.length||categories.includes(e.categoryId!))&&(!types.length||types.includes(kind))&&
      (!positions.length||positions.includes(a?.position??''))&&(!groups.length||a?.organizations.some(id=>groups.includes(id)));
  }),[entries,categories,types,assignments,positions,groups]);
  const query=normalized(term);
  const donors=useMemo(()=>Array.from(new Map(scoped.map(r=>[r.key,{id:r.key,label:r.name+' · '+r.kind+(r.e.memberId?' '+r.e.memberId.slice(-6):'')}])).values())
    .filter(d=>normalized(d.label).includes(query)).sort((a,b)=>a.label.localeCompare(b.label,'ko')),[scoped,query]);
  const matched=useMemo(()=>new Set(donors.map(d=>d.id)),[donors]);
  const rows=useMemo(()=>scoped.filter(r=>matched.has(r.key)&&(!names.length||names.includes(r.key))),[scoped,matched,names]);
  const summaries=useMemo(()=>{const sums=new Map<string,number>();for(const r of rows)sums.set(r.category,(sums.get(r.category)??0)+r.e.amount);return sums;},[rows]);
  const total=Array.from(summaries.values()).reduce((sum,n)=>sum+n,0);
  const last=Math.max(0,Math.ceil(rows.length/pageSize)-1),current=Math.min(last,page);
  const change=(setter:(v:string[])=>void)=>(value:string[])=>{setter(value);setNames([]);setPage(0);setLimit(12);};
  function reset(){setCategories([]);setTypes([]);setPositions([]);setGroups([]);setNames([]);setTerm('');setPage(0);setLimit(12);}
  return <section className="panel detail-body finance-print">
    <div className="finance-no-print">
      <Choices label="헌금 종류" options={options} selected={categories} change={change(setCategories)}/>
      <Choices label="명의 구분" options={kinds.map(id=>({id,label:id}))} selected={types} change={change(setTypes)}/>
      <details onToggle={e=>setExpanded(e.currentTarget.open)}><summary>직분·소속·개별 명의 선택</summary>
        {directory?<><p>{data.year}년 교적 배정 기준입니다. 직분·소속은 개인 명의로 기록한 헌금에 적용됩니다.</p>
          {directory.positions.length>0&&<Choices label="직분" options={directory.positions} selected={positions} change={change(setPositions)}/>}
          {directory.organizations.length>0&&<Choices label="소속 조직" options={directory.organizations} selected={groups} change={change(setGroups)}/>}
          {!directory.positions.length&&!directory.organizations.length&&<p>이 연도의 직분·조직 배정 자료가 없습니다.</p>}</>:
          error?<p>교적 분류를 불러오지 못했습니다. <button className="button" onClick={()=>{setError(false);retry(n=>n+1)}}>다시 시도</button></p>:<p role="status">교적 분류를 불러오는 중…</p>}
        <label>명의 검색<input type="search" value={term} placeholder="이름, 가족명 또는 교적번호 끝자리" onChange={e=>{setTerm(e.target.value);setNames([]);setPage(0);setLimit(12);}}/></label>
        <Choices label="헌금 명의" options={donors.slice(0,limit)} selected={names} change={v=>{setNames(v);setPage(0)}}/>
        {donors.length>limit&&<button className="button" onClick={()=>setLimit(n=>n+12)}>명의 더 보기 ({limit}/{donors.length})</button>}
      </details>
      {(categories.length+types.length+positions.length+groups.length+names.length>0||term)&&<button className="button" onClick={reset}>조회 조건 초기화</button>}
    </div>
    <h2>헌금 조회 결과</h2><p aria-live="polite">{period} · {rows.length}건 · 합계 <strong>{won(total)}</strong></p>
    <p>{[...options.filter(o=>categories.includes(o.id)).map(o=>o.label),...types,...(directory?.positions??[]).filter(o=>positions.includes(o.id)).map(o=>o.label),...(directory?.organizations??[]).filter(o=>groups.includes(o.id)).map(o=>o.label),...donors.filter(d=>names.includes(d.id)).map(d=>d.label),term].filter(Boolean).join(' · ')||'전체 헌금'}</p>
    {summaries.size>1&&<details><summary>헌금 종류별 소계</summary>{Array.from(summaries,([k,n])=><p key={k}>{k} · {won(n)}</p>)}</details>}
    <div className="finance-actions finance-no-print"><button className="button" disabled={!rows.length} onClick={()=>{flushSync(()=>setPrinting(true));try{window.print()}finally{setPrinting(false)}}}>조회 결과 인쇄</button>
    <button className="button" disabled={!rows.length} onClick={()=>download([['날짜','명의','구분','헌금 종류','금액'],...rows.map(r=>[r.e.date,r.name,r.kind,r.category,r.e.amount])],'헌금내역')}>조회 결과 CSV</button></div>
    {rows.length?<div className="finance-table"><table><thead><tr><th>헌금일</th><th>명의</th><th>헌금 종류</th><th>금액</th></tr></thead><tbody>{(printing?rows:rows.slice(current*pageSize,(current+1)*pageSize)).map(r=><tr key={r.e.id}><td>{r.e.date}</td><td>{r.name} · {r.kind}</td><td>{r.category}</td><td>{won(r.e.amount)}</td></tr>)}</tbody></table></div>:<p>이 기간과 조건에 해당하는 헌금이 없습니다.</p>}
    {last>0&&<div className="finance-actions finance-no-print"><button className="button" disabled={!current} onClick={()=>setPage(current-1)}>이전</button><span>{current+1} / {last+1}페이지</span><button className="button" disabled={current===last} onClick={()=>setPage(current+1)}>다음</button></div>}
  </section>;
}
