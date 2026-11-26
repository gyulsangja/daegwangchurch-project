'use client';
import {useState} from 'react';
import type {FinanceSnapshot} from '@daegwang/contracts/finance';

type Props={data:FinanceSnapshot;download:(rows:(string|number)[][],name:string)=>void};
const labels={national:'소득세',local:'지방소득세',other:'기타 공제',activity:'비과세 종교활동비',exempt:'그 밖의 확인된 비과세액'};
const empty={national:'',local:'',other:'',activity:'',exempt:''};
const won=(n:number)=>n.toLocaleString('ko-KR')+'원';

export function FinanceTax({data,download}:Props){
  const [id,setId]=useState(''),[basis,setBasis]=useState('net'),[type,setType]=useState(''),[name,setName]=useState(''),[source,setSource]=useState(''),[month,setMonth]=useState('');
  const [fields,setFields]=useState(empty);
  const expenses=data.entries.filter(e=>e.status==='POSTED'&&e.kind==='EXPENSE');
  const entry=expenses.find(e=>e.id===id);
  const withheld=Number(fields.national)+Number(fields.local)+Number(fields.other);
  const exempt=Number(fields.activity)+Number(fields.exempt);
  const gross=(entry?.amount??0)+(basis==='net'?withheld:0);
  const net=gross-withheld;
  const valid=!!entry&&net>=0&&exempt<=gross;
  return <section className="panel detail-body"><h2>목회자 사례비 지급 검토표</h2>
    <form className="finance-form" onSubmit={e=>{e.preventDefault();if(!valid||!entry)return;
      download([['전표번호','귀속월','지급일','수령인','소득 구분','전표 금액 기준','총지급액','종교활동비(비과세)','기타 비과세','과세 대상 지급액','소득세','지방소득세','기타 공제','실수령액','증빙번호','비과세·공제 근거'],
        [entry.id,month,entry.date,name,type,basis==='net'?'실수령액':'총지급액',gross,Number(fields.activity),Number(fields.exempt),gross-exempt,Number(fields.national),Number(fields.local),Number(fields.other),net,entry.receipt,source]],'목회자사례비-지급검토표');
    }}>
      <label>지출 전표<select required value={id} onChange={e=>{const row=expenses.find(x=>x.id===e.target.value);setId(e.target.value);setFields(empty);setName(row?.party??'');setMonth(row?.date.slice(0,7)??'');setSource('');setBasis('net');setType('')}}><option value="">전표 선택</option>{expenses.map(e=><option key={e.id} value={e.id}>{e.date} · {e.party||e.memo} · {won(e.amount)}</option>)}</select></label>
      <label>전표 금액 기준<select value={basis} onChange={e=>setBasis(e.target.value)}><option value="net">공제 후 실수령액</option><option value="gross">공제 전 총지급액</option></select></label>
      <label>지급 대상자<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>귀속월<input type="month" required value={month} onChange={e=>setMonth(e.target.value)}/></label>
      <label>소득 구분<select required value={type} onChange={e=>setType(e.target.value)}><option value="">선택</option><option>기타소득(종교인소득)</option><option>근로소득</option></select></label>
      {(Object.keys(labels) as (keyof typeof labels)[]).map(k=><label key={k}>{labels[k]} · 원<input type="number" min="0" max="1000000000000" step="1" placeholder="0" value={fields[k]} onChange={e=>setFields({...fields,[k]:e.target.value})}/></label>)}
      <label>비과세·기타 공제 근거<input required={exempt>0||Number(fields.other)>0} maxLength={300} placeholder="예: 지급 기준 의결일·증빙번호" value={source} onChange={e=>setSource(e.target.value)}/></label>
      {entry&&<p className="finance-wide" role="status">{valid?'총지급 '+won(gross)+' · 과세 대상 '+won(gross-exempt)+' · 실수령 '+won(net):'비과세액 또는 총 공제액이 지급액을 초과합니다.'}</p>}
      <button className="button" disabled={!valid}>지급 검토표 CSV 저장</button>
    </form>
    <p>확인된 세액과 공제액을 입력하세요. 지급 검토표는 내려받은 파일에 보관됩니다. 종교활동비는 교회 지급 기준과 실제 용도를 확인해 구분하세요.</p>
    <p>종교인소득 지급명세서의 일반 제출 기한은 지급한 해의 다음 해 3월 10일입니다. 소득 구분과 원천징수·연말정산 방식에 따라 제출할 서식을 확인하세요. <a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7702&amp;mi=2433">국세청 원천징수·연말정산 안내</a></p>
  </section>;
}
