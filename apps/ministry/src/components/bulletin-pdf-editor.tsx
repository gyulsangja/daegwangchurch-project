'use client';
import {useEffect,useRef,useState} from 'react';
import {bulletinUploadGrant} from '@daegwang/contracts/bulletin-upload';
import type {WorshipManagementRow} from '@daegwang/contracts/worship-management';
import {bulletinStatusLabels} from '@daegwang/contracts/features/bulletins/schema';
type Draft={id:string;expectedUpdatedAt:string|null;title:string;worshipDate:string;summary:string;status:'DRAFT'|'PUBLISHED'|'PRIVATE'};
export function BulletinPdfEditor({row,month,onSaved}:{row?:WorshipManagementRow;month:string;onSaved:()=>void}){
 const [draft,setDraft]=useState<Draft|null>(null);const [file,setFile]=useState<File|null>(null);const [receipt,setReceipt]=useState('');const [busy,setBusy]=useState(false);const [progress,setProgress]=useState('');const [error,setError]=useState('');const dialog=useRef<HTMLDialogElement>(null);const fileInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(draft)dialog.current?.showModal();else dialog.current?.close();},[draft]);
 function begin(){setFile(null);setReceipt('');setError('');setProgress('');if(fileInput.current)fileInput.current.value='';setDraft(row?{id:row.id,expectedUpdatedAt:row.updatedAt,title:row.title,worshipDate:row.date,summary:row.summary,status:row.status}:{id:crypto.randomUUID(),expectedUpdatedAt:null,title:'',worshipDate:month+'-01',summary:'',status:'DRAFT'});}
 async function post(body:unknown){const r=await fetch('/api/v1/worship',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw Error(value.message??'처리하지 못했습니다.');return value;}
 async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!draft||!file)return;const confirmed=new FormData(event.currentTarget).get('publishConfirmed')==='on';setBusy(true);setError('');
  try{if(!file.name.toLowerCase().endsWith('.pdf')||file.size>10*1024*1024||file.size===0)throw Error('10MB 이하의 PDF 파일을 선택해 주세요.');if(await file.slice(0,5).text()!=='%PDF-')throw Error('올바른 PDF 파일인지 확인해 주세요.');
   let proof=receipt;if(!proof){setProgress('PDF 업로드 준비 중…');const grant=bulletinUploadGrant.parse(await post({operation:'PREPARE_PDF',name:file.name,size:file.size}));setProgress('PDF 업로드 중…');const body=new FormData();body.append('cacheControl','3600');body.append('',file);const uploaded=await fetch(grant.uploadUrl,{method:'PUT',headers:{'x-upsert':'false'},body,signal:AbortSignal.timeout(120000)});if(!uploaded.ok)throw Error('파일을 올리지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');proof=grant.receipt;setReceipt(proof);}
   setProgress('파일 확인 및 주보 저장 중…');const saved=await post({...draft,operation:'SAVE_PDF',receipt:proof,publishConfirmed:confirmed});if(!saved.saved)throw Error('저장을 확인하지 못했습니다.');setDraft(null);onSaved();
  }catch(e){setError(e instanceof Error?e.message:'주보를 저장하지 못했습니다.');}finally{setBusy(false);setProgress('');}}
 return <><button className="button" onClick={begin}>{row?'PDF 교체':'주보 등록'}</button><dialog ref={dialog} className="pastoral-dialog" onCancel={e=>{if(busy)e.preventDefault();else setDraft(null);}}><form onSubmit={save}><div className="section-heading"><h2>{row?'주보 PDF 교체':'주보 등록'}</h2><button className="button" type="button" disabled={busy} onClick={()=>setDraft(null)}>닫기</button></div>{draft&&<fieldset className="pastoral-fields" disabled={busy}>
 <label>주보 제목<input required maxLength={160} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
 <label>예배 날짜<input type="date" required value={draft.worshipDate} onChange={e=>setDraft({...draft,worshipDate:e.target.value})}/></label>
 <label>PDF 파일 (최대 10MB)<input ref={fileInput} type="file" required accept="application/pdf,.pdf" onChange={e=>{setFile(e.target.files?.[0]??null);setReceipt('');}}/></label>
 <p className="muted">{row?'교체 전 파일은 이력에 보관됩니다. 기존 말씀 연결과 주보 주소는 유지됩니다.':'등록한 주보를 홈페이지·앱에서 함께 사용합니다.'} PDF는 공개 파일 저장소에 보관되므로 내부 개인정보가 담긴 문서는 올리지 마세요.</p>
 <label>공개 안내<textarea maxLength={1000} value={draft.summary} onChange={e=>setDraft({...draft,summary:e.target.value})}/></label>
 <label>공개 상태<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Draft['status']})}>{Object.entries(bulletinStatusLabels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
 {draft.status==='PUBLISHED'&&<label className="check"><input required name="publishConfirmed" type="checkbox"/>제목·안내·PDF를 홈페이지와 앱에 공개합니다.</label>}
 <button className="button primary">{busy?'처리 중…':'주보 저장'}</button></fieldset>}<p role="status">{progress}</p><p role="alert">{error}</p></form></dialog></>;
}
