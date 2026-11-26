'use client';
import {useState} from 'react';
import type {FinanceSnapshot} from '@daegwang/contracts/finance';

type Props={data:FinanceSnapshot;download:(rows:(string|number)[][],name:string)=>void};
const labels={national:'소득세',local:'지방소득세',other:'기타 공제',activity:'비과세 종교활동비',exempt:'그 밖의 확인된 비과세액'};
const payLabels={bonus:'상여·명절 사례',meal:'현금 식사대',ministry:'목회활동비',transport:'차량·여비',housing:'주거·기타 수당'};
const blankPay={bonus:'',meal:'',ministry:'',transport:'',housing:''};
const empty={national:'',local:'',other:'',activity:'',exempt:''};
const won=(n:number)=>n.toLocaleString('ko-KR')+'원';

export function FinanceTax({data,download}:Props){
  const [id,setId]=useState(''),[basis,setBasis]=useState('net'),[type,setType]=useState(''),[name,setName]=useState(''),[source,setSource]=useState(''),[month,setMonth]=useState('');
  const [pay,setPay]=useState(blankPay);
  const [mealExempt,setMealExempt]=useState(''),[mealUsed,setMealUsed]=useState(''),[mealProvided,setMealProvided]=useState(false);
  const [fields,setFields]=useState(empty);
  const expenses=data.entries.filter(e=>e.status==='POSTED'&&e.kind==='EXPENSE');
  const entry=expenses.find(e=>e.id===id);
  const withheld=Number(fields.national)+Number(fields.local)+Number(fields.other);
  const exempt=Number(fields.activity)+Number(fields.exempt)+Number(mealExempt);
  const gross=(entry?.amount??0)+(basis==='net'?withheld:0);
  const net=gross-withheld;
  const basic=gross-Object.values(pay).reduce((sum,v)=>sum+Number(v),0);
  const mealLimit=mealProvided?0:Math.max(0,200000-Number(mealUsed));
  const valid=!!entry && net>=0 && basic>=0 && exempt<=gross && Number(fields.activity)<=Number(pay.ministry) && Number(mealExempt)<=Math.min(Number(pay.meal),mealLimit);

  return <section className="panel detail-body"><h2>목회자 사례비 지급 검토표</h2>
    <form className="finance-form" onSubmit={e=>{e.preventDefault();if(!valid||!entry)return;
      download([['전표번호','귀속월','지급일','수령인','소득 구분','전표 금액 기준','총지급액','기본 사례비',...Object.values(payLabels),'식사대 비과세','당월 기사용 식사대 비과세','교회 식사 제공','종교활동비(비과세)','기타 비과세','과세 대상 지급액','소득세','지방소득세','기타 공제','실수령액','증빙번호','비과세·공제 근거'],
        [entry.id,month,entry.date,name,type,basis==='net'?'실수령액':'총지급액',gross,basic,...Object.values(pay).map(Number),Number(mealExempt),Number(mealUsed),mealProvided?'제공':'미제공',Number(fields.activity),Number(fields.exempt),gross-exempt,Number(fields.national),Number(fields.local),Number(fields.other),net,entry.receipt,source]],'목회자사례비-지급검토표');
    }}>
      <label>지출 전표<select required value={id} onChange={e=>{const row=expenses.find(x=>x.id===e.target.value);setId(e.target.value);setFields(empty);setPay(blankPay);setMealExempt('');setMealUsed('');setMealProvided(false);setName(row?.party??'');setMonth(row?.date.slice(0,7)??'');setSource('');setBasis('net');setType('')}}><option value="">전표 선택</option>{expenses.map(e=><option key={e.id} value={e.id}>{e.date} · {e.party||e.memo} · {won(e.amount)}</option>)}</select></label>
      <label>전표 금액 기준<select value={basis} onChange={e=>setBasis(e.target.value)}><option value="net">공제 후 실수령액</option><option value="gross">공제 전 총지급액</option></select></label>
      <label>지급 대상자<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>귀속월<input type="month" required value={month} onChange={e=>setMonth(e.target.value)}/></label>
      <label>소득 구분<select required value={type} onChange={e=>setType(e.target.value)}><option value="">선택</option><option>기타소득(종교인소득)</option><option>근로소득</option></select></label>
      <fieldset className="finance-wide"><legend>지급 항목</legend><p>상여나 수당을 나누어 입력하면 총지급액에서 남은 금액을 기본 사례비로 표시합니다.</p>
        <div className="finance-form">{(Object.keys(payLabels) as (keyof typeof payLabels)[]).map(k=><label key={k}>{payLabels[k]} · 원<input type="number" min="0" max="1000000000000" step="1" placeholder="0" value={pay[k]} onChange={e=>{setPay({...pay,[k]:e.target.value});if(k==='meal')setMealExempt('');}}/></label>)}</div>
        {entry&&<p>기본 사례비 {won(basic)}</p>}</fieldset>
      {Number(pay.meal)>0&&<fieldset className="finance-wide"><legend>식사대 비과세 확인</legend>
        <label><input type="checkbox" checked={mealProvided} onChange={e=>{setMealProvided(e.target.checked);setMealExempt('')}}/> 교회에서 식사 제공</label>
        <label>같은 달에 이미 적용한 비과세 식사대 · 원<input type="number" min="0" step="1" value={mealUsed} placeholder="0" onChange={e=>setMealUsed(e.target.value)}/></label>
        <label>이번 지급분 중 확인된 비과세 식사대 · 원<input type="number" min="0" step="1" max={Math.min(mealLimit,Number(pay.meal))} value={mealExempt} placeholder="0" disabled={mealProvided} onChange={e=>setMealExempt(e.target.value)}/></label></fieldset>}
      {(Object.keys(labels) as (keyof typeof labels)[]).map(k=><label key={k}>{labels[k]} · 원<input type="number" min="0" max="1000000000000" step="1" placeholder="0" value={fields[k]} onChange={e=>setFields({...fields,[k]:e.target.value})}/></label>)}
      <label>비과세·기타 공제 근거<input required={exempt>0||Number(fields.other)>0} maxLength={300} placeholder="예: 지급 기준 의결일·증빙번호" value={source} onChange={e=>setSource(e.target.value)}/></label>
      {entry&&<p className="finance-wide" role="status">{valid?'총지급 '+won(gross)+' · 과세 대상 '+won(gross-exempt)+' · 실수령 '+won(net):'수당 합계, 식사대 한도, 활동비 중 비과세액과 공제액을 확인하세요.'}</p>}
      <button className="button" disabled={!valid}>지급 검토표 CSV 저장</button>
    </form>
    <details className="finance-edit-panel"><summary>교회에서 준비할 지급 기준과 증빙</summary>
      <ol><li>연간 예산에서 기본 사례비·상여·수당을 정하고 적용 대상, 지급 주기, 의결일을 기록하세요.</li>
      <li>개인에게 지급한 활동비는 교회 규약·의결로 정한 기준과 종교활동 용도를 확인하세요. 교회가 직접 결제한 행사비, 증빙으로 정산한 교회 비용은 개인 급여에 다시 더하지 마세요.</li>
      <li>현금 식사대는 식사 제공 여부와 같은 달의 다른 지급분을 함께 확인하세요. 차량·여비는 실비 정산과 정액 보조를 구분하고 증빙을 보관하세요.</li>
      <li>지급일에 전표·이체 내역과 검토표를 대조하고, 연말에 수령인별 지급액·비과세 종교활동비·원천징수액을 모아 지급명세서를 준비하세요.</li></ol>
      <a href="https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&amp;lsJoLnkSeq=1028597625">소득세법 시행령 제19조</a> · <a href="https://yesimchurch.imweb.me/26">예심교회 지급·실비정산 규정 사례</a></details>
    <p>확인된 세액과 공제액을 입력하세요. 지급 검토표는 내려받은 파일에 보관됩니다. 종교활동비는 교회 지급 기준과 실제 용도를 확인해 구분하세요.</p>
    <p>종교인소득 지급명세서의 일반 제출 기한은 지급한 해의 다음 해 3월 10일입니다. 소득 구분과 원천징수·연말정산 방식에 따라 제출할 서식을 확인하세요. <a href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7702&amp;mi=2433">국세청 원천징수·연말정산 안내</a></p>
  </section>;
}
