'use client';
import { useState } from 'react';

export type Period = { start: string; end: string };

export function PeriodPicker({ year, disabled, onChange }: {
  year: number; disabled: boolean; onChange: (range: Period | null) => void;
}) {
  const [mode, setMode] = useState('year');
  const [month, setMonth] = useState(new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Seoul'}).slice(5,7));
  const [start, setStart] = useState(year + '-01-01');
  const [end, setEnd] = useState(year + '-12-31');
  function monthly(value: string) {
    const last = new Date(Date.UTC(year, Number(value), 0)).getUTCDate();
    onChange({start: year+'-'+value+'-01', end: year+'-'+value+'-'+last});
  }
  return <fieldset className="finance-period finance-no-print" disabled={disabled}>
    <legend>조회 기간</legend>
    <div className="finance-actions">
      <label>조회 단위<select value={mode} onChange={e => {
        const next=e.target.value; setMode(next);
        if (next==='year') onChange(null);
        if (next==='month') monthly(month);
        if (next==='range' && start && end && start<=end) onChange({start,end});
      }}><option value="year">연간</option><option value="month">월별</option><option value="range">기간 지정</option></select></label>
      {mode==='month' && <label>조회 월<select value={month} onChange={e=>{setMonth(e.target.value);monthly(e.target.value);}}>
        {Array.from({length:12},(_,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{i+1}월</option>)}
      </select></label>}
      {mode==='range' && <form className="finance-actions" onSubmit={e=>{e.preventDefault();onChange({start,end});}}>
        <label>시작일<input required type="date" min={year+'-01-01'} max={end || year+'-12-31'} value={start} onChange={e=>setStart(e.target.value)}/></label>
        <label>종료일<input required type="date" min={start || year+'-01-01'} max={year+'-12-31'} value={end} onChange={e=>setEnd(e.target.value)}/></label>
        <button className="button">기간 적용</button>
      </form>}
    </div>
  </fieldset>;
}
