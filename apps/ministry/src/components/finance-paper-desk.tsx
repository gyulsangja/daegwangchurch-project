'use client';
import {useState} from 'react';
import type {FinanceEntry,FinanceSnapshot} from '@daegwang/contracts/finance';
import {previewGiftForm} from './finance-receipt';

type Props={data:FinanceSnapshot;save:(p:Record<string,unknown>)=>Promise<boolean>};
export function GiftSource({data,entry,change}:{data:FinanceSnapshot;entry:FinanceEntry;change:(entry:FinanceEntry)=>void}){
 const [type,setType]=useState(entry.party.startsWith('가족 · ')?'가족':entry.party.startsWith('조직 · ')?'조직':entry.party?'직접 입력':'개인');
 return <><label>봉투에 적힌 명의<select value={type} onChange={e=>{setType(e.target.value);change({...entry,memberId:null,party:''});}}>{['개인','가족','조직','직접 입력','무명'].map(x=><option key={x}>{x}</option>)}</select></label>
 {type==='개인'&&<label>헌금자 · 교적 연결<select value={entry.memberId??''} onChange={e=>change({...entry,memberId:e.target.value||null})} required><option value="">교인 선택</option>{data.members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label>}
 {['가족','조직','직접 입력'].includes(type)&&<label>{type} 명의<input required maxLength={94} list="gift-source-names" value={['가족','조직'].includes(type)?entry.party.replace(/^(가족|조직) · /,''):entry.party} onChange={e=>change({...entry,party:['가족','조직'].includes(type)?type+' · '+e.target.value:e.target.value})}/><datalist id="gift-source-names">{(type==='가족'?data.families?.map(f=>f.name):type==='조직'?data.organizations:[])?.map((name,i)=><option key={i} value={name}/>)}</datalist></label>}</>;
}

export function PaperDesk({data,save}:Props){
 const [id,setId]=useState(''),[family,setFamily]=useState(''),[person,setPerson]=useState(''),[amount,setAmount]=useState(''),[msg,setMsg]=useState('');
 const receipts=data.receipts??[];
 const available=(e:FinanceEntry)=>e.amount-receipts.filter(r=>r.id===e.id&&!r.voided).reduce((n,r)=>n+r.amount,0);
 const sources=data.entries.filter(e=>e.kind==='INCOME'&&e.status==='POSTED'&&data.categories.some(k=>k.id===e.categoryId&&k.offering)&&available(e)>0);
 const entry=sources.find(e=>e.id===id);
 const members=family?data.members.filter(m=>data.families?.find(f=>f.id===family)?.memberIds.includes(m.id)):data.members;
 const [outside,setOutside]=useState('');
 const name=person==='__external'?outside.trim():data.members.find(m=>m.id===person)?.name;
 const [serial,setSerial]=useState('');
 return <section className="panel detail-body"><h2>서면 기부금영수증</h2>
 <details open={!data.paperEnabled}><summary>교회 발급 정보 · {data.year}년</summary>
 <form className="finance-form" onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);await save({action:'ISSUER_SETUP',...Object.fromEntries(f),confirmed:true});}}>
 <label>단체명<input required name="name" defaultValue="대광교회" maxLength={100}/></label><label>교회 고유번호 · 숫자 10자리<input name="registration" required pattern="[0-9]{10}" inputMode="numeric" maxLength={10}/></label>
 <label>교회 주소<input required name="address" maxLength={200}/></label><label>공제 대상 근거 법령<input required name="legalBasis" maxLength={150}/></label>
 <label>기부금 유형 코드<input required name="giftCode" pattern="[0-9]{2}" maxLength={2}/></label><label>확인한 근거 자료<input required name="reason" maxLength={300} placeholder="소속 증명서 등 자료명"/></label>
 <label><input type="checkbox" required/> 해당 연도 발급 자격과 서면 발급 가능 여부를 확인했습니다.</label><button className="button">발급 정보 저장</button></form></details>
 <form className="finance-form" onSubmit={async e=>{e.preventDefault();if(!entry||!name)return;const f=new FormData(e.currentTarget);if(await save({action:'RECEIPT_SHARE',id,memberId:person==='__external'?null:person,donorName:person==='__external'?outside.trim():undefined,amount:Number(amount),reason:f.get('reason')})){setId('');setAmount('');}}}>
 <label>원본 헌금 전표<select required value={entry?id:''} onChange={e=>{const selected=sources.find(v=>v.id===e.target.value);setId(e.target.value);setFamily('');setOutside('');setPerson(selected?.memberId??'');setAmount(selected?String(available(selected)):'');}}>
 <option value="">조회 기간의 승인된 헌금 선택</option>{sources.map(e=><option key={e.id} value={e.id}>{e.date} · {data.members.find(m=>m.id===e.memberId)?.name||e.party||'무명'} · 남은 {available(e).toLocaleString()}원 · {e.id.slice(-6)}</option>)}</select></label>
 <label>가족에서 찾기<select value={family} onChange={e=>{setFamily(e.target.value);setPerson('');}}><option value="">전체 교인</option>{data.families?.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
 <label>영수증의 실제 기부자<select required value={person} onChange={e=>setPerson(e.target.value)}><option value="">교인 선택</option>{!family&&<option value="__external">교적에 없는 기부자 직접 입력</option>}{members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label>
 {person==='__external'&&<label>실제 기부자 성명<input required maxLength={100} value={outside} onChange={e=>setOutside(e.target.value)}/></label>}
 <label>이 기부자가 낸 금액<input type="number" min={1} max={entry?available(entry):0} step={1} required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label>실제 기부자·금액 확인 근거<input name="reason" required maxLength={300} placeholder="예: 헌금자 확인 기록"/></label>
 <p>가족 공동 헌금은 각자가 낸 금액만 발급하세요. 조직 자체의 헌금을 개인 명의로 발급할 수 없습니다. 주소·식별번호와 서명은 인쇄 후 서면에 기재하세요.</p>
 <button type="button" className="button" disabled={!entry||!name||!Number.isSafeInteger(+amount)||+amount<=0||+amount>available(entry)} onClick={()=>{if(entry&&name&&!previewGiftForm(name,[{date:entry.date,amount:+amount}]))setMsg('팝업을 허용해 주세요.');}}>서식 미리보기</button>
 <button className="button primary" disabled={!entry||!name||!data.paperEnabled}>개인 영수증 발급</button></form>
 <h3>발급 대장 · {data.year}년</h3>{!receipts.length&&<p>발급한 영수증이 없습니다.</p>}{receipts.map(r=><div className="finance-line" key={r.serial}><span>제{r.serial}호 · {r.name} · {r.amount.toLocaleString()}원 · {r.voided?'취소':'발급'}</span>{!r.voided&&<div><button className="button" onClick={()=>{if(!previewGiftForm(r.name,[r],r))setMsg('팝업을 허용해 주세요.');}}>인쇄·재인쇄</button>{r.share&&<button className="button" onClick={()=>setSerial(r.serial)}>취소·정정</button>}</div>}</div>)}
 {serial&&<form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(await save({action:'RECEIPT_CANCEL',serial,reason:f.get('reason')}))setSerial('');}}><label>제{serial}호 취소 사유<input required maxLength={300} name="reason"/></label><p>기존 발급본을 회수하거나 취소를 안내하고, 정정분은 새 번호로 발급하세요.</p><button className="button">취소 확정</button><button type="button" className="button" onClick={()=>setSerial('')}>닫기</button></form>}
 <p role="status">{msg}</p></section>;
}
