'use client';
import {useEffect,useState} from 'react';

type Totals={income:number;expense:number;balance:number};
type Props={year:number;period:{start:string;end:string}|null;current:Totals};
const won=(n:number)=>n.toLocaleString('ko-KR');
function previousDate(date:string){
  const [year,month,day]=date.split('-').map(Number);
  const last=new Date(Date.UTC(year-1,month,0)).getUTCDate();
  return [year-1,String(month).padStart(2,'0'),String(Math.min(day,last)).padStart(2,'0')].join('-');
}
export function PriorPeriod({year,period,current}:Props){
  const [open,setOpen]=useState(false),[prior,setPrior]=useState<Totals|null>(null),[status,setStatus]=useState(''),[retry,setRetry]=useState(0);
  const first=period?previousDate(period.start):'',last=period?previousDate(period.end):'';
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController();const params=new URLSearchParams({year:String(year-1),summary:'1'});
    if(first){params.set('start',first);params.set('end',last)}
    setStatus('전년 자료를 불러오는 중…');setPrior(null);
    fetch('/api/v1/finance?'+params,{signal:controller.signal,cache:'no-store'}).then(async res=>{if(!res.ok)throw Error();return res.json() as Promise<{available:boolean;totals:Totals}>}).then(result=>{
      if(controller.signal.aborted)return;
      setPrior(result.available?result.totals:null);setStatus(result.available?'':'전년도 장부가 개설되지 않았습니다.');
    }).catch(()=>{if(!controller.signal.aborted)setStatus('전년 자료를 불러오지 못했습니다.')});return ()=>controller.abort();
  },[open,first,last,year,retry]);
  if(year<=2000)return null;
  return <section><button type="button" className="button finance-no-print" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'전년 비교 접기':'전년 같은 기간과 비교'}</button>
    {open&&<><h3>전년 동기 비교</h3><p>{first?first+' ~ '+last:(year-1)+'년 전체'} 대비 · 단위 원</p>
      {status&&<p role="status">{status}{status.includes('못했')&&<button className="button" onClick={()=>setRetry(retry+1)}>다시 조회</button>}</p>}
      {prior&&<div className="finance-table"><table><thead><tr>{['구분','전년 동기','이번 기간','증감액','증감률'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
        {([['세입',prior.income,current.income],['세출',prior.expense,current.expense],['수지 차액',prior.income-prior.expense,current.income-current.expense],['기말 자금',prior.balance,current.balance]] as const).map(([label,old,now])=><tr key={label}><th>{label}</th><td>{won(old)}</td><td>{won(now)}</td><td>{won(now-old)}</td><td>{old>0?((now-old)*100/old).toFixed(1)+'%':'—'}</td></tr>)}
      </tbody></table></div>}</>}
  </section>;
}
