'use client';
import {useMemo,useState} from 'react';
import {flushSync} from 'react-dom';
import type {FinanceEntry,FinanceSnapshot} from '@daegwang/contracts/finance';

type Donor={key:string;name:string;kind:string;entries:FinanceEntry[]};
const won=(amount:number)=>amount.toLocaleString('ko-KR')+'원';
const pageSize=12;
const normalize=(s:string)=>s.normalize('NFC').replace(/\s+/g,'').toLocaleLowerCase('ko');
export function GivingReport({data,download}:{data:FinanceSnapshot;download:(rows:(string|number)[][],name:string)=>void}){
  const [term,setTerm]=useState(''),[selected,setSelected]=useState(''),[category,setCategory]=useState(''),[page,setPage]=useState(0),[limit,setLimit]=useState(8),[printing,setPrinting]=useState(false);
  const categories=useMemo(()=>new Map(data.categories.filter(c=>c.offering&&c.kind==='INCOME').map(c=>[c.id,c.name])),[data.categories]);
  const donors=useMemo(()=>{
    const people=new Map<string,Donor>();
    for(const m of data.members)people.set('member:'+m.id,{key:'member:'+m.id,name:m.name,kind:'교인 · '+m.id.slice(-6),entries:[]});
    for(const e of data.entries){
      if(e.kind!=='INCOME'||e.status!=='POSTED'||!categories.has(e.categoryId??''))continue;
      const party=e.party.trim();
      const key=e.memberId?'member:'+e.memberId:party?'party:'+party:'anonymous';
      let donor=people.get(key);
      if(!donor){
        const match=party.match(/^(가족|조직) · (.+)$/);
        donor={key,name:match?.[2]||party||(e.memberId?'교적 연결 명의':'무명'),kind:e.memberId?'교인 · '+e.memberId.slice(-6):match?.[1]||'봉투 명의',entries:[]};people.set(key,donor);
      }
      donor.entries.push(e);
    }
    return people;
  },[data.members,data.entries,categories]);
  const query=normalize(term);
  const matches=useMemo(()=>query?[...donors.values()].filter(d=>normalize(d.name+' '+d.kind).includes(query)).sort((a,b)=>a.name.localeCompare(b.name,'ko')||a.key.localeCompare(b.key)):[],[donors,query]);
  const donor=donors.get(selected);
  const rows=useMemo(()=>donor?donor.entries.filter(e=>!category||e.categoryId===category).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)):[],[donor,category]);
  const last=Math.max(0,Math.ceil(rows.length/pageSize)-1),current=Math.min(last,page);
  return <section className="panel detail-body finance-print">
    <div className="finance-no-print"><label>헌금 명의 검색<input type="search" autoComplete="off" placeholder="교인 이름, 가족·모임 이름 또는 무명" value={term} onChange={e=>{setTerm(e.target.value);setSelected('');setLimit(8);setPage(0);setCategory('')}}/></label>
    {!query&&<p>조회할 이름을 입력하세요. 같은 이름의 교인은 교적 식별번호 끝자리로 구분합니다.</p>}
    {query&&!donor&&<><p role="status">{matches.length?matches.length+'개 명의가 검색되었습니다.':'일치하는 명의가 없습니다. 이름이나 조회 기간을 확인하세요.'}</p>
      <div className="finance-actions">{matches.slice(0,limit).map(d=><button className="button" key={d.key} onClick={()=>{setSelected(d.key);setPage(0)}}>{d.name} · {d.kind}</button>)}</div>
      {matches.length>limit&&<button className="button" onClick={()=>setLimit(limit+8)}>검색 결과 더 보기</button>}</>}
    </div>
    {donor&&<><h2>{donor.name} 헌금 내역</h2><p>{donor.kind} · {category?categories.get(category):'전체 헌금 종류'} · {rows.length}건 · 합계 {won(rows.reduce((n,e)=>n+e.amount,0))}</p>
      <div className="finance-actions finance-no-print"><button className="button" onClick={()=>{setSelected('');setCategory('');setPage(0)}}>명의 다시 선택</button>
        <label>헌금 종류<select value={category} onChange={e=>{setCategory(e.target.value);setPage(0)}}><option value="">전체 종류</option>{[...categories].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
        <button className="button" disabled={!rows.length} onClick={()=>{flushSync(()=>setPrinting(true));try{window.print()}finally{setPrinting(false)}}}>조회 결과 인쇄</button>
        <button className="button" disabled={!rows.length} onClick={()=>download([['날짜','명의','헌금 종류','금액'],...rows.map(e=>[e.date,donor.name,categories.get(e.categoryId!)??'',e.amount])],'헌금내역')}>조회 결과 CSV</button></div>
      {rows.length?<div className="finance-table"><table><thead><tr><th>헌금일</th><th>종류</th><th>금액</th></tr></thead><tbody>{(printing?rows:rows.slice(current*pageSize,(current+1)*pageSize)).map(e=><tr key={e.id}><td>{e.date}</td><td>{categories.get(e.categoryId!)}</td><td>{won(e.amount)}</td></tr>)}</tbody></table></div>:<p>선택한 기간과 종류에 해당하는 헌금이 없습니다.</p>}
      {last>0&&<div className="finance-actions finance-no-print"><button className="button" disabled={!current} onClick={()=>setPage(current-1)}>이전</button><span>{current+1} / {last+1}페이지</span><button className="button" disabled={current===last} onClick={()=>setPage(current+1)}>다음</button></div>}
    </>}
  </section>;
}
