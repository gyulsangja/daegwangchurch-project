'use client';
import {useState} from 'react';
import type {FinanceSnapshot} from '@daegwang/contracts/finance';
type Props={data:FinanceSnapshot;enabled:boolean;save:(command:Record<string,unknown>)=>Promise<boolean>};

export function MonthClose({data,enabled,save,initialMonth}:Props&{initialMonth?:number}){
 const [month,setMonth]=useState(initialMonth??Number(new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}).slice(5,7)));
 const [reason,setReason]=useState('');
 const closed=data.months?.includes(month);
 const drafts=data.entries.filter(e=>Number(e.date.slice(5,7))===month && e.status==='DRAFT').length;
 return <section className="panel detail-body"><h2>월 마감</h2>
 <div className="month-grid">{Array.from({length:12},(_,i)=>i+1).map(m=><button key={m} type="button" aria-pressed={m===month} onClick={()=>{setMonth(m);setReason('');}}>{m}월<small>{data.months?.includes(m)?'마감':'작성 중'}</small></button>)}</div>
 <form onSubmit={async e=>{e.preventDefault();if(await save({action:closed?'MONTH_REOPEN':'MONTH_CLOSE',month,reason}))setReason('');}}>
 <p>{month}월 · {closed?'마감됨':drafts?'승인 대기 '+drafts+'건':'마감 가능'}</p><label>처리 사유<input required maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/></label>
 <button className="button primary" disabled={!enabled||(!closed && !!drafts)}>{month}월 {closed?'마감 해제':'마감'}</button></form></section>;
}

export function CategoryEditor({data,enabled,save}:Props){
 const [kind,setKind]=useState<'INCOME'|'EXPENSE'>('INCOME');
 const [id,setId]=useState('');
 const items=data.categories.filter(c=>c.kind===kind);
 const item=items.find(c=>c.id===id);
 return <section className="panel detail-body"><h2>계정과목 · 헌금 종류</h2>
 <label>장부 구분<select value={kind} onChange={e=>{setKind(e.target.value as typeof kind);setId('');}}><option value="INCOME">수입</option><option value="EXPENSE">지출</option></select></label>
 <label>관리할 항목<select value={id} onChange={e=>setId(e.target.value)}><option value="">새 항목</option>{items.map(c=><option key={c.id} value={c.id}>{c.section && c.section+' / '}{c.name}{c.active===false?' (사용 중지)':''}</option>)}</select></label>
 <form key={kind+id} className="finance-form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const key=id||crypto.randomUUID();
 if(await save({action:'CATEGORY_CONFIG',id:key,kind,section:f.get('section'),name:f.get('name'),offering:item?item.offering:f.has('offering'),active:f.has('active')}))setId(key);}}>
 <label>상위 분류<input name="section" list="finance-sections" defaultValue={item?.section} maxLength={80}/><datalist id="finance-sections">{[...new Set(items.map(c=>c.section).filter(Boolean))].map(s=><option key={s} value={s}/>)}</datalist></label>
 <label>항목 이름<input required name="name" defaultValue={item?.name} maxLength={100}/></label>
 {kind==='INCOME'&&<label><input name="offering" type="checkbox" disabled={!!item} defaultChecked={item?.offering}/> 개인별 헌금 집계</label>}
 <label><input name="active" type="checkbox" defaultChecked={item?.active!==false}/> 신규 전표에 사용</label>
 <button className="button primary" disabled={!enabled}>항목 저장</button></form></section>;
}
