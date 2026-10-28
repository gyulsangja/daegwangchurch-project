'use client';
import {useEffect,useRef,useState} from 'react';
import {videoManagementDetail} from '@daegwang/contracts/worship-management';
import {worshipTypeLabels,contentStatusLabels} from '@daegwang/contracts/features/worship/schema';
import {parseYouTubeUrl} from '@daegwang/contracts/lib/youtube/parser';
type Draft=Omit<ReturnType<typeof videoManagementDetail.parse>['video'],'expectedUpdatedAt'>&{expectedUpdatedAt:string|null};
export function WorshipVideoEditor({id,month,onSaved}:{id?:string;month:string;onSaved:()=>void}){
 const [open,setOpen]=useState(false);const [draft,setDraft]=useState<Draft|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 useEffect(()=>{
  if(!open)return;const abort=new AbortController();
  if(id){void fetch(`/api/v1/worship?${new URLSearchParams({month,kind:'VIDEO_DETAIL',id})}`,{cache:'no-store',signal:abort.signal}).then(async r=>{const value=await r.json();if(!r.ok)throw Error(value.message);return videoManagementDetail.parse(value).video;}).then(value=>{if(!abort.signal.aborted)setDraft(value);}).catch(e=>{if(!abort.signal.aborted)setError(e instanceof Error?e.message:'말씀을 불러오지 못했습니다.');});}
  return()=>abort.abort();
 },[id,month,open]);
 function begin(){setError('');setDraft(id?null:{id:crypto.randomUUID(),expectedUpdatedAt:null,type:'SUNDAY_MORNING',title:'',contentDate:new Date(Date.now()+9*3600000).toISOString().slice(0,7)===month?new Date(Date.now()+9*3600000).toISOString().slice(0,10):month+'-01',youtubeUrl:'',preacher:'',scripture:'',description:'',summary:'',status:'DRAFT',isPinned:false});setOpen(true);}
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!draft)return;const confirmed=new FormData(e.currentTarget).get('publishConfirmed')==='on';setBusy(true);setError('');try{const r=await fetch('/api/v1/worship',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,operation:'SAVE_VIDEO',publishConfirmed:confirmed})});const value=await r.json();if(!r.ok||!value.saved)throw Error(value.message??'저장하지 못했습니다.');setOpen(false);onSaved();}catch(e){setError(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setBusy(false);}}
 const video=draft?parseYouTubeUrl(draft.youtubeUrl):null;
 return <><button className={id?'button':'button primary'} onClick={begin}>{id?'열기·수정':'말씀 등록'}</button><dialog ref={dialog} className="pastoral-dialog" onCancel={e=>{if(busy)e.preventDefault();else setOpen(false);}}><form onSubmit={save}><div className="section-heading"><h2>{id?'말씀·영상 수정':'말씀·영상 등록'}</h2><button className="button" type="button" disabled={busy} onClick={()=>setOpen(false)}>닫기</button></div>{!draft&&!error&&<p role="status">말씀 정보를 불러오는 중…</p>}{draft&&<fieldset className="pastoral-fields" disabled={busy}>
 <label>예배·영상 종류<select value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value as Draft['type']})}>{Object.entries(worshipTypeLabels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
 <label>날짜<input type="date" required value={draft.contentDate} onChange={e=>setDraft({...draft,contentDate:e.target.value})}/></label>
 <label>제목<input required maxLength={160} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></label>
 <label>YouTube 영상 주소<input required type="url" value={draft.youtubeUrl} onChange={e=>setDraft({...draft,youtubeUrl:e.target.value})}/></label>
 {video&&<a href={video.canonicalUrl} target="_blank" rel="noopener noreferrer">영상 확인 ↗</a>}
 <label>설교자<input maxLength={80} value={draft.preacher} onChange={e=>setDraft({...draft,preacher:e.target.value})}/></label>
 <label>성경 위치<input maxLength={160} placeholder="예: 요한복음 1:1–5" value={draft.scripture} onChange={e=>setDraft({...draft,scripture:e.target.value})}/></label>
 <label>공개 설명<textarea rows={4} maxLength={2000} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
 <label>짧은 요약<textarea maxLength={500} value={draft.summary} onChange={e=>setDraft({...draft,summary:e.target.value})}/></label>
 <label>공개 상태<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value as Draft['status']})}>{Object.entries(contentStatusLabels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
 <label className="check"><input type="checkbox" checked={draft.isPinned} onChange={e=>setDraft({...draft,isPinned:e.target.checked})}/>메인에 우선 표시</label>
 {draft.status==='PUBLISHED'&&<label className="check"><input required type="checkbox" name="publishConfirmed"/>홈페이지·앱에 함께 공개하며 기존 알림 정책이 적용됨을 확인합니다.</label>}
 <p className="muted">같은 원본을 홈페이지와 앱에서 사용합니다. 임시저장·비공개 자료는 이용자에게 표시되지 않습니다.</p>
 <button className="button primary" disabled={!!draft.youtubeUrl&&!video}>{busy?'저장 중…':'저장'}</button></fieldset>}<p role="alert">{error}</p></form></dialog></>;
}
