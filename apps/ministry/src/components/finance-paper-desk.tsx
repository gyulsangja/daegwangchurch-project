'use client';
import {useState} from 'react';
import type {FinanceEntry,FinanceSnapshot} from '@daegwang/contracts/finance';
import {ReceiptRegister} from './finance-receipt-register';
import {IssuerForm} from './finance-issuer';
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
 const [view,setView]=useState<'write'|'list'|'issuer'>('write');
 const [date,setDate]=useState(new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}).replace(/^\d{4}/,String(data.year)));
 const [description,setDescription]=useState('');
 const [inKind,setInKind]=useState(false),[quantity,setQuantity]=useState('1'),[price,setPrice]=useState('');
 const goods=inKind?{quantity:Number(quantity),unitPrice:Number(price)}:undefined;
 const total=goods?goods.quantity*goods.unitPrice:Number(amount);
 const receipts=data.receipts??[];
 const available=(e:FinanceEntry)=>e.amount-receipts.filter(r=>r.id===e.id&&!r.voided).reduce((n,r)=>n+r.amount,0);
 const sources=data.entries.filter(e=>e.kind==='INCOME'&&e.status==='POSTED'&&data.categories.some(k=>k.id===e.categoryId&&k.offering)&&available(e)>0);
 const entry=sources.find(e=>e.id===id);
 const members=family?data.members.filter(m=>data.families?.find(f=>f.id===family)?.memberIds.includes(m.id)):data.members;
 const [outside,setOutside]=useState('');
 const name=person==='__external'?outside.trim():data.members.find(m=>m.id===person)?.name;

 return <section className="panel detail-body"><h2>서면 기부금영수증</h2>
 <div className="finance-view-switch" aria-label="영수증 업무">{([['write','영수증 작성'],['list','발급 대장'],['issuer','교회 발급 정보']] as const).map(([key,label])=><button key={key} className="button" aria-pressed={key===view} onClick={()=>setView(key)}>{label}</button>)}</div>
 {view==='issuer' && <><h3>{data.year}년 교회 발급 정보</h3>
 <IssuerForm issuer={data.issuer} save={save}/></>}
 {view==='write' && <><p>직접 작성하거나 기존 헌금을 선택해 날짜·내용·금액을 불러오세요.</p>{!data.paperEnabled&&<p>정식 발급 전 <button className="button" onClick={()=>setView('issuer')}>교회 발급 정보 설정</button></p>}
 <form className="finance-form" onSubmit={async e=>{e.preventDefault();if(!name)return;const f=new FormData(e.currentTarget);if(await save({action:'RECEIPT_WRITE',id:entry?.id??null,date,description,memberId:person==='__external'?null:person,donorName:person==='__external'?outside.trim():undefined,goods,amount:total,reason:f.get('reason')})){setId('');setAmount('');setDescription('');setView('list');}}}>
 <label>헌금 불러오기 · 선택<select value={entry?id:''} onChange={e=>{const selected=sources.find(v=>v.id===e.target.value);setId(e.target.value);if(!selected)return;setInKind(false);setDate(selected.date);setDescription((selected.memo||data.categories.find(c=>c.id===selected.categoryId)?.name||'헌금').slice(0,100));setFamily('');setOutside('');setPerson(selected?.memberId??'');setAmount(selected?String(available(selected)):'');}}>
 <option value="">직접 작성</option>{sources.map(e=><option key={e.id} value={e.id}>{e.date} · {data.members.find(m=>m.id===e.memberId)?.name||e.party||'무명'} · 남은 {available(e).toLocaleString()}원 · {e.id.slice(-6)}</option>)}</select></label>
 <label>가족에서 찾기<select value={family} onChange={e=>{setFamily(e.target.value);setPerson('');}}><option value="">전체 교인</option>{data.families?.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
 <label>영수증의 실제 기부자<select required value={person} onChange={e=>setPerson(e.target.value)}><option value="">교인 선택</option>{!family&&<option value="__external">교적에 없는 기부자 직접 입력</option>}{members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.id.slice(-6)}</option>)}</select></label>
 {person==='__external'&&<label>실제 기부자 성명<input required maxLength={100} value={outside} onChange={e=>setOutside(e.target.value)}/></label>}
 <label>기부 구분<select value={inKind?'goods':'money'} disabled={!!entry} onChange={e=>setInKind(e.target.value==='goods')}><option value="money">금전</option><option value="goods">현물</option></select></label>
 <label>기부일<input required type="date" min={data.year+'-01-01'} max={data.year+'-12-31'} value={date} onChange={e=>setDate(e.target.value)}/></label><label>{inKind?'품명':'기부 내용'}<input required maxLength={100} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 {inKind?<><label>수량<input required type="number" min={1} step={1} value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>단가 · 원<input required type="number" min={1} step={1} value={price} onChange={e=>setPrice(e.target.value)}/></label><p>현물 평가액 {total.toLocaleString()}원</p></>:<label>이 기부자가 낸 금액<input type="number" min={1} max={entry?available(entry):1_000_000_000_000} step={1} required value={amount} onChange={e=>setAmount(e.target.value)}/></label>}
 <label>실제 기부자·금액 확인 근거<input name="reason" required maxLength={300} placeholder="예: 헌금자 확인 기록"/></label>
 <p>가족 공동 헌금은 각자가 낸 금액만 발급하세요. 조직 자체의 헌금을 개인 명의로 발급할 수 없습니다. 주민등록번호와 주소는 인쇄 창에서 입력하세요.</p>
 <button type="button" className="button" disabled={!name||!description.trim()||!date.startsWith(data.year+'-')||!Number.isSafeInteger(total)||total<=0||total>1e12} onClick={()=>{if(name&&!previewGiftForm(name,[{date,amount:total,description,goods}],undefined,data.issuer??undefined))setMsg('팝업을 허용해 주세요.');}}>서식 미리보기</button>
 <button className="button primary" disabled={!name||!data.paperEnabled}>개인 영수증 발급</button></form></>}
 {view==='list'&&<ReceiptRegister year={data.year} version={data.version} save={save}/>}<p role="status">{msg}</p></section>;
}
