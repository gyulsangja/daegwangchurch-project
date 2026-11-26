'use client';
import {useRef,useState} from 'react';
export type Period={start:string;end:string};
function monthRange(year:number,month:number){
  const base=year+'-'+String(month).padStart(2,'0');
  return {start:base+'-01',end:base+'-'+new Date(Date.UTC(year,month,0)).getUTCDate()};
}
export function PeriodPicker({year,value,disabled,onChange}:{year:number;value:Period|null;disabled:boolean;onChange:(p:Period|null)=>void}){
  const [editing,setEditing]=useState(false);
  const [start,setStart]=useState(''),[end,setEnd]=useState('');
  const picker=useRef<HTMLSelectElement>(null);
  const month=value?Number(value.start.slice(5,7)):0;
  const full=monthRange(year,month);
  const active=!value?'year':value.start===full.start&&value.end===full.end?String(month):'range';
  function close(){setEditing(false);picker.current?.focus();}
  return <div className="period-control" onKeyDown={e=>{if(editing&&e.key==='Escape'){e.preventDefault();close();}}}>
    <label>조회 기간<select ref={picker} value={editing?'custom':active} disabled={disabled} onChange={e=>{
      const choice=e.target.value;
      if(choice==='custom'){setStart(value?.start??year+'-01-01');setEnd(value?.end??year+'-12-31');setEditing(true);}
      else{setEditing(false);onChange(choice==='year'?null:monthRange(year,Number(choice)));}
    }}><option value="year">연간 전체</option>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1}월</option>)}
    {active==='range'&&<option value="range" disabled>{value?.start.slice(5)} ~ {value?.end.slice(5)}</option>}<option value="custom">기간 직접 지정…</option></select></label>
    {editing&&<form className="period-dates" onSubmit={e=>{e.preventDefault();onChange({start,end});close();}}>
      <label>시작일<input type="date" autoFocus required min={year+'-01-01'} max={end||year+'-12-31'} value={start} onChange={e=>setStart(e.target.value)}/></label>
      <label>종료일<input type="date" required min={start||year+'-01-01'} max={year+'-12-31'} value={end} onChange={e=>setEnd(e.target.value)}/></label>
      <div><button className="button" type="button" onClick={close}>취소</button> <button className="button primary">기간 적용</button></div>
    </form>}
  </div>;
}
