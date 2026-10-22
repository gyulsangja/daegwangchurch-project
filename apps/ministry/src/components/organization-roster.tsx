'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { organizationRoleCodes } from '@daegwang/contracts/ministry-years';
import type { MinistryYear } from '@daegwang/ministry-core/years';
type Props={period:MinistryYear;members:{id:string;name:string}[];disabled:boolean;initialOrganization?:string;onDirty:(dirty:boolean)=>void};
export function OrganizationRoster({period,members,disabled,initialOrganization,onDirty}:Props) {
  const [orgId,setOrgId]=useState(period.organizations.find(o=>o.id===initialOrganization)?.id ?? period.organizations[0]?.id ?? '');
  const [dirty,setDirty]=useState(false);
  const org=period.organizations.find(o=>o.id===orgId);
  return <div className="roster-workspace"><nav className="roster-organizations" aria-label="배정할 조직"><h3>조직 선택</h3>{period.organizations.map(o=><button key={o.id} aria-pressed={o.id===orgId} onClick={()=>{if(o.id===orgId)return;if(dirty&&!window.confirm('저장하지 않은 배정을 버리고 다른 조직을 열까요?'))return;setOrgId(o.id);setDirty(false);onDirty(false);}}><strong>{o.name}</strong><small>{period.organizationTypes.find(t=>t.code===o.type)?.label} · {period.assignments.filter(a=>a.affiliations.some(f=>f.organizationId===o.id)).length}명</small></button>)}</nav>{org ? <RosterEditor key={org.id} period={period} org={org} members={members} disabled={disabled} onDirty={value=>{setDirty(value);onDirty(value);}}/> : <p className="empty">‘조직 구성’에서 조직을 먼저 추가해 주세요.</p>}</div>;
}
function RosterEditor({period,org,members,disabled,onDirty}:{period:MinistryYear;org:MinistryYear['organizations'][number];members:Props['members'];disabled:boolean;onDirty:Props['onDirty']}) {
  const initial=Object.fromEntries(period.assignments.flatMap(a=>{const f=a.affiliations.find(f=>f.organizationId===org.id);return f?[[a.memberId,f.role]]:[]}));
  const [roster,setRoster]=useState<Record<string,string>>(initial);
  const [search,setSearch]=useState('');const [onlyMembers,setOnlyMembers]=useState(false);
  const saved=useRef(false);
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const dirty=JSON.stringify(Object.entries(roster).sort())!==JSON.stringify(Object.entries(initial).sort());
  useEffect(()=>{if(!dirty)return;const handler=(event:BeforeUnloadEvent)=>{if(!saved.current)event.preventDefault();};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
  const people=period.state==='ARCHIVED'?period.assignments.map(a=>({id:a.memberId,name:a.name})):members;
  const visible=people.filter(m=>m.name.includes(search.trim())&&(!onlyMembers || m.id in roster));
  const roles=period.roles.filter(r=>organizationRoleCodes(org).includes(r.code));
  const mutate=(next:Record<string,string>)=>{setRoster(next);onDirty(JSON.stringify(Object.entries(next).sort())!==JSON.stringify(Object.entries(initial).sort()));};
  const changes=people.filter(m=>roster[m.id]!==initial[m.id] || (m.id in roster)!==(m.id in initial));
  async function save(){setBusy(true);setMessage('');try{const response=await fetch(`/api/v1/years/${period.year}/roster`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:period.version,organizationId:org.id,members:Object.entries(roster).map(([memberId,role])=>({memberId,role}))})});const result=await response.json();if(!response.ok)throw new Error(result.message);saved.current=true;onDirty(false);const url=new URL(window.location.href);url.searchParams.set('tab','구성원 배정');url.searchParams.set('organization',org.id);window.location.assign(url);}catch(error){setMessage(error instanceof Error?error.message:'저장하지 못했습니다.');setBusy(false);}}
  return <section className="roster-editor"><div className="section-heading"><div><h2>{org.name}</h2><p>{org.parentId ? `${period.organizations.find(o=>o.id===org.parentId)?.name} 아래 조직 · ` : ''}{Object.keys(roster).length}명 선택 · {period.year}년</p></div></div><p className="muted">구성원을 여러 명 선택하고 역할을 지정한 뒤 한 번에 저장하세요. 다른 소속과 교회 직분은 유지됩니다. 상위 조직 소속은 자동으로 추가되지 않습니다.</p>
    <Link className="text-link" href={`/settings?year=${period.year}&tab=${encodeURIComponent('조직 구성')}&organization=${org.id}`} onClick={event=>{if(dirty&&!window.confirm('저장하지 않은 배정을 버리고 역할 설정으로 이동할까요?'))event.preventDefault();}}>이 조직의 이름·유형·역할 설정 →</Link><div className="role-overview">{roles.map(r=><div key={r.code}><strong>{r.label}</strong><span>{people.filter(m=>roster[m.id]===r.code).map(m=>m.name).join(', ')||'미배정'}</span></div>)}</div>
    <div className="roster-tools"><label>교인 검색<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름으로 찾기"/></label><label className="check"><input type="checkbox" checked={onlyMembers} onChange={e=>setOnlyMembers(e.target.checked)}/>선택한 구성원만</label>{!disabled&&<button className="button" disabled={busy||!visible.length} onClick={()=>mutate({...roster,...Object.fromEntries(visible.map(m=>[m.id,roster[m.id]??'']))})}>검색 결과 모두 추가</button>}</div>
    <fieldset disabled={disabled||busy} className="roster-list"><legend className="sr-only">{org.name} 구성원 배정</legend>{visible.map(m=><div className="roster-person" key={m.id}><label className="check"><input type="checkbox" checked={m.id in roster} onChange={e=>{const next={...roster};if(e.target.checked)next[m.id]='';else delete next[m.id];mutate(next);}}/>{m.name}</label><label>조직 내 역할<select aria-label={`${m.name} 역할`} disabled={!(m.id in roster)||disabled||busy} value={roster[m.id]??''} onChange={e=>mutate({...roster,[m.id]:e.target.value})}><option value="">일반 구성원</option>{roles.map(r=><option key={r.code} value={r.code}>{r.label}</option>)}</select></label></div>)}{!visible.length&&<p className="empty">검색 조건에 맞는 교인이 없습니다.</p>}</fieldset>
    {message&&<p role="alert" className="feedback">{message}</p>}{!disabled&&<div className="roster-save"><p>{changes.length?`${changes.length}명의 추가·제외·역할 변경을 저장합니다.`:'저장된 배정과 같습니다.'}</p>{changes.length>0&&<small>{changes.map(m=>`${m.name}: ${!(m.id in roster)?'소속 제외':roles.find(r=>r.code===roster[m.id])?.label??'일반 구성원'}`).join(' · ')}</small>}<button className="button primary" disabled={busy||!dirty} onClick={()=>void save()}>{busy?'저장 중…':`${org.name} 배정 저장`}</button></div>}
  </section>;
}
