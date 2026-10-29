'use client';
import {useState} from 'react';
import {documentExtension,documentTypes,prepareDocument} from '@daegwang/contracts/document-upload';
import {managedMedia,type ManagedMedia} from '@daegwang/contracts/media-management';
export function PublicDocumentUpload({disabled,onBusyChange,onSelect}:{disabled:boolean;onBusyChange:(v:boolean)=>void;onSelect:(v:ManagedMedia)=>void}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function post(input:unknown){const r=await fetch('/api/v1/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const json=await r.json();if(!r.ok)throw Error(json.message);return json;}
 async function upload(file:File){setBusy(true);onBusyChange(true);setMessage('파일을 올리는 중…');try{
  const extension=documentExtension.parse(file.name.split('.').pop()?.toLowerCase());const input=prepareDocument.parse({operation:'PREPARE_DOCUMENT',name:file.name,extension,size:file.size});const grant=await post(input);
  const sent=await fetch(grant.uploadUrl,{method:'PUT',headers:{'Content-Type':documentTypes[extension],'x-upsert':'false'},body:file});if(!sent.ok)throw Error('파일 전송을 완료하지 못했습니다. 다시 시도해 주세요.');
  const result=await post({operation:'COMPLETE_DOCUMENT',receipt:grant.receipt});onSelect(managedMedia.parse(result.data));setMessage('파일을 추가했습니다. 공지를 저장하면 첨부됩니다.');
 }catch(e){setMessage(e instanceof Error&&e.name!=='ZodError'?e.message:'PDF·DOCX·XLSX·PPTX·HWP·UTF-8 TXT, 5MB 이하 파일을 선택하세요.');}finally{setBusy(false);onBusyChange(false);}}
 return <div><label>문서 파일 추가<input type="file" accept=".pdf,.docx,.xlsx,.pptx,.hwp,.txt" disabled={disabled||busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file);}}/></label><p className="muted">공개할 문서만 올려 주세요. 파일당 5MB까지 지원합니다.</p><p role="status">{message}</p></div>;
}
