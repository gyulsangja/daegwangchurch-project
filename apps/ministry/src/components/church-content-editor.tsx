'use client';
/* eslint-disable @next/next/no-img-element -- Public storage image previews retain original proportions. */
import {useEffect,useRef,useState} from 'react';
import {contentPage,contentRow,type ContentRow} from '@daegwang/contracts/church-content-management';
import {type ManagedMedia} from '@daegwang/contracts/media-management';
import {PublicImagePicker} from './public-image-picker';
const statuses={DRAFT:'임시저장',PUBLISHED:'공개',PRIVATE:'비공개',ARCHIVED:'보관됨'};
const localTime=(value:string)=>value?new Date(new Date(value).getTime()+9*3600000).toISOString().slice(0,16):'';
const isoTime=(value:string)=>value?new Date(`${value}:00+09:00`).toISOString():'';
export function ChurchContentEditor(){
 const [kind,setKind]=useState<'EVENT'|'NOTICE'>('EVENT');const [page,setPage]=useState(0);const [query,setQuery]=useState('');const [reload,setReload]=useState(0);
 const [rows,setRows]=useState<ContentRow[]>([]);const [next,setNext]=useState<number|null>(null);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const [mediaChanged,setMediaChanged]=useState(false);const [mediaEditable,setMediaEditable]=useState(true);
 const [files,setFiles]=useState<ManagedMedia[]>([]);const [cover,setCover]=useState<ManagedMedia|null>(null);const [imageBusy,setImageBusy]=useState(false);const [opening,setOpening]=useState(false);
 const [edit,setEdit]=useState<ContentRow|null>(null);const [version,setVersion]=useState<string|null>(null);const modal=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   setLoading(true);setError('');
   try{const r=await fetch(`/api/v1/church-content?${new URLSearchParams({kind,page:String(page),q:query})}`,{cache:'no-store',signal:controller.signal});const json=await r.json();if(!r.ok)throw new Error(json.message);const result=contentPage.parse(json);if(controller.signal.aborted)return;setRows(result.data);setNext(result.nextPage);}
   catch(e){if(!controller.signal.aborted){setRows([]);setNext(null);setError(e instanceof Error?e.message:'목록을 불러오지 못했습니다.');}}
   finally{if(!controller.signal.aborted)setLoading(false);}
  }
  void load();return ()=>controller.abort();
 },[kind,page,query,reload]);
 async function open(row?:ContentRow){
  setOpening(true);setError('');setMediaChanged(false);setMediaEditable(true);
  try{
  if(row){const r=await fetch(`/api/v1/church-content?${new URLSearchParams({kind:row.kind,id:row.id})}`,{cache:'no-store'});const json=await r.json();if(!r.ok)throw Error(json.message);const detail=contentPage.parse(json).data[0];if(!detail)throw Error('게시물을 찾을 수 없습니다.');row=detail;setMediaEditable(row.kind==='NOTICE'?detail.attachmentsComplete!==false:detail.coverEditable!==false);setFiles(detail.attachments??[]);setCover(detail.coverImage??null);}else{setFiles([]);setCover(null);}
  const item=row??{id:crypto.randomUUID(),kind,title:'',category:kind==='EVENT'?'교회 일정':'교회 소식',status:'DRAFT' as const,updatedAt:'',body:'',startsAt:'',endsAt:'',isAllDay:false,location:'',ministryName:'',isImportant:false,isPinned:false,publishStartsAt:'',publishEndsAt:'',attachmentCount:0};
  setVersion(row?.updatedAt??null);setEdit({...item,startsAt:localTime(item.startsAt),endsAt:localTime(item.endsAt),publishStartsAt:localTime(item.publishStartsAt),publishEndsAt:localTime(item.publishEndsAt)});setMessage('');modal.current?.showModal();
  }catch(e){setError(e instanceof Error?e.message:'게시물을 열지 못했습니다.');}finally{setOpening(false);}
 }
 async function save(e:React.FormEvent){
  e.preventDefault();if(!edit||imageBusy)return;setSaving(true);setMessage('');
  try{
   const data=edit.kind==='EVENT'?{title:edit.title,category:edit.category,startsAt:isoTime(edit.startsAt),endsAt:isoTime(edit.endsAt),isAllDay:edit.isAllDay,location:edit.location,ministryName:edit.ministryName,description:edit.body,status:edit.status}:{title:edit.title,category:edit.category,body:edit.body,status:edit.status,isImportant:edit.isImportant,isPinned:edit.isPinned,publishStartsAt:isoTime(edit.publishStartsAt),publishEndsAt:isoTime(edit.publishEndsAt)};
   const r=await fetch('/api/v1/church-content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:edit.kind,id:edit.id,expectedUpdatedAt:version,publishConfirmed:new FormData(e.currentTarget as HTMLFormElement).get('publicationAcknowledged')==='on',data,...(mediaChanged&&mediaEditable?(edit.kind==='NOTICE'?{attachmentIds:files.map(file=>file.id)}:{coverImageId:cover?.id??null}):{})})});
   const result=await r.json();if(!r.ok)throw new Error(result.message);contentRow.parse(result.data);
   modal.current?.close();setEdit(null);setMessage('저장했습니다. 홈페이지와 앱은 같은 공개 자료를 보여줍니다. 중요 공지·교회 일정 알림은 기존 알림 정책과 수신 설정에 따라 처리됩니다.');setReload(n=>n+1);
  }catch(e){setMessage(e instanceof Error?e.message:'저장하지 못했습니다. 입력 내용을 유지했습니다.');}finally{setSaving(false);}
 }
 const text=(label:string,key:'title'|'category'|'startsAt'|'endsAt'|'location'|'ministryName'|'publishStartsAt'|'publishEndsAt',required=false,type='text',maxLength=160)=><label>{label}<input type={type} required={required} maxLength={maxLength} value={edit?.[key]??''} onChange={e=>edit&&setEdit({...edit,[key]:e.target.value})}/></label>;
 return <><div className="pastoral-toolbar"><div className="chips">{(['EVENT','NOTICE'] as const).map(k=><button key={k} className="button" aria-pressed={kind===k} onClick={()=>{setKind(k);setPage(0);setQuery('');setMessage('');}}>{k==='EVENT'?'교회 일정':'공지사항'}</button>)}</div><button className="button primary" disabled={loading||opening||!!error} onClick={()=>open()}>{kind==='EVENT'?'일정 등록':'공지 작성'}</button></div>
  <form className="pastoral-toolbar" onSubmit={e=>{e.preventDefault();setQuery(String(new FormData(e.currentTarget).get('q')??''));setPage(0);setReload(n=>n+1);}}><label>제목 검색<input name="q" maxLength={100} key={kind}/></label><button className="button">검색</button><button type="button" className="button" onClick={()=>setReload(n=>n+1)}>새로고침</button></form>
  {!edit&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
  {loading?<p role="status">게시물을 불러오는 중…</p>:!error&&<section className="panel detail-body"><h2>{kind==='EVENT'?'일정 목록':'공지 목록'}</h2><p className="muted">임시저장·비공개 자료도 포함하며 최근 수정 순으로 표시합니다.</p>{!rows.length?<p className="empty">해당 게시물이 없습니다.</p>:<ul className="history-list">{rows.map(row=><li key={row.id}><div className="section-heading"><div><strong>{row.title}</strong><p>{statuses[row.status]} · {row.category}{row.startsAt&&` · ${new Date(row.startsAt).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}`}{row.attachmentCount>0&&` · 첨부 ${row.attachmentCount}개`}</p></div><button className="button" disabled={opening||row.status==='ARCHIVED'} onClick={()=>open(row)}>열기·수정</button></div></li>)}</ul>}<div className="chips">{page>0&&<button className="button" onClick={()=>setPage(n=>n-1)}>이전</button>}{next!==null&&<button className="button" onClick={()=>setPage(next)}>다음</button>}</div></section>}
  <dialog ref={modal} className="pastoral-dialog" onCancel={e=>{if(saving||imageBusy)e.preventDefault();else setEdit(null);}}><form onSubmit={save}><div className="section-heading"><h2>{edit?.kind==='EVENT'?'교회 일정':'공지사항'} {version?'수정':'등록'}</h2><button type="button" className="button" disabled={saving||imageBusy} onClick={()=>{modal.current?.close();setEdit(null);}}>닫기</button></div>{edit&&<fieldset className="pastoral-fields" disabled={saving}>
   {text('제목','title',true)}{text('분류','category',true,'text',40)}
   {edit.kind==='EVENT'&&<>{text('시작 · 한국 시간','startsAt',true,'datetime-local')}{text('종료 · 한국 시간','endsAt',false,'datetime-local')}<label className="check"><input type="checkbox" checked={edit.isAllDay} onChange={e=>setEdit({...edit,isAllDay:e.target.checked})}/>종일 일정</label>{text('장소','location')}{text('담당 부서·모임','ministryName',false,'text',80)}</>}
   <label>{edit.kind==='EVENT'?'일정 안내':'본문'}<textarea rows={8} required={edit.kind==='NOTICE'} maxLength={edit.kind==='EVENT'?5000:20000} value={edit.body} onChange={e=>setEdit({...edit,body:e.target.value})}/></label>
   {edit.kind==='NOTICE'&&<><div className="chips"><label className="check"><input type="checkbox" checked={edit.isImportant} onChange={e=>setEdit({...edit,isImportant:e.target.checked})}/>중요 공지</label><label className="check"><input type="checkbox" checked={edit.isPinned} onChange={e=>setEdit({...edit,isPinned:e.target.checked})}/>상단 고정</label></div>{text('게시 시작 · 한국 시간','publishStartsAt',false,'datetime-local')}{text('게시 종료 · 한국 시간','publishEndsAt',false,'datetime-local')}</>}
   <section>{!mediaEditable&&<p role="status">일부 첨부 자료를 표시할 수 없어 첨부 변경을 잠시 제한합니다. 제목·본문을 저장해도 기존 파일 연결은 그대로 유지됩니다.</p>}<h3>{edit.kind==='NOTICE'?'첨부 이미지·파일':'일정 표지 이미지'}</h3>{(edit.kind==='NOTICE'?files:cover?[cover]:[]).map((file,index)=><div key={file.id} className="panel detail-body">{file.mimeType.startsWith('image/')&&<img src={file.url} alt={file.name} style={{maxWidth:'100%',maxHeight:200,objectFit:'contain'}}/>}<a href={file.url} target="_blank" rel="noopener noreferrer" style={{overflowWrap:'anywhere'}}>{file.name}</a><div className="chips">{edit.kind==='NOTICE'&&index>0&&<button type="button" className="button" disabled={imageBusy||!mediaEditable} onClick={()=>{setMediaChanged(true);setFiles(previous=>{const next=[...previous];[next[index-1],next[index]]=[next[index],next[index-1]];return next;});}}>위로</button>}<button type="button" className="button" disabled={imageBusy||!mediaEditable} onClick={()=>{setMediaChanged(true);if(edit.kind==='NOTICE')setFiles(previous=>previous.filter(item=>item.id!==file.id));else setCover(null);}}>연결 제거</button></div></div>)}<PublicImagePicker disabled={saving||!mediaEditable||(edit.kind==='NOTICE'&&files.length>=10)} onBusyChange={setImageBusy} onSelect={file=>{setMediaChanged(true);if(edit.kind==='NOTICE')setFiles(previous=>previous.some(item=>item.id===file.id)?previous:[...previous,file]);else setCover(file);}}/>{edit.kind==='NOTICE'&&<p className="muted">첨부 순서대로 홈페이지와 앱 본문 아래에 표시됩니다. 기존 문서는 유지하거나 연결을 제거할 수 있습니다. 새 문서 파일 등록은 기존 관리자에서 가능합니다.</p>}</section>
   <label>공개 상태<select value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value as ContentRow['status']})}>{(['DRAFT','PUBLISHED','PRIVATE'] as const).map(s=><option key={s} value={s}>{statuses[s]}</option>)}</select></label>
   <p className="muted">{edit.status==='PUBLISHED'?'공개로 저장하면 게시 기간에 맞춰 홈페이지·앱에 표시됩니다.':'임시저장·비공개 자료는 홈페이지·앱에 표시되지 않습니다.'} 상담·심방 메모나 개인정보는 입력하지 마세요. 공개 일정과 중요 공지는 기존 알림 정책에 따라 푸시 대상이 될 수 있습니다.</p>
   {edit.status==='PUBLISHED'&&<label className="check"><input type="checkbox" name="publicationAcknowledged" required={edit.status==='PUBLISHED'}/>공개 및 기존 알림 정책 적용을 확인했습니다.</label>}<p role="alert">{message}</p><button className="button primary" disabled={imageBusy}>{saving?'저장 중…':edit.status==='PUBLISHED'?'공개 상태로 저장':'저장'}</button>
  </fieldset>}</form></dialog>
 </>;
}
