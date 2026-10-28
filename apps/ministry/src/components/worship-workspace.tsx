'use client';
import {WorshipSourceDelete} from './worship-source-delete';
import {BulletinPdfEditor} from './bulletin-pdf-editor';
import {WorshipVideoEditor} from './worship-video-editor';
import {WorshipSessions} from './worship-sessions';
import {BulletinHistory} from './bulletin-history';
import {useEffect,useRef,useState} from 'react';
import {worshipManagementPage,worshipManagementBundle,type WorshipManagementRow} from '@daegwang/contracts/worship-management';
const labels={DRAFT:'임시저장',PUBLISHED:'공개',PRIVATE:'비공개'};
const types:Record<string,string>={SUNDAY_MORNING:'주일오전예배',SUNDAY_AFTERNOON:'주일오후 성경공부',WEDNESDAY:'수요기도회',FIRST_HOUR:'첫시간 주님께',SPECIAL:'특별예배',PRAISE:'찬양'};
async function load(query:Record<string,string>,signal:AbortSignal){
 const response=await fetch(`/api/v1/worship?${new URLSearchParams(query)}`,{cache:'no-store',signal});const value=await response.json();if(!response.ok)throw new Error(value.message);return value;
}
type Bundle=ReturnType<typeof worshipManagementBundle.parse>;
export function WorshipWorkspace({canPrint=false,canDelete=false}:{canPrint?:boolean;canDelete?:boolean}){
 const [month,setMonth]=useState(()=>new Date(Date.now()+9*3600000).toISOString().slice(0,7));const [pages,setPages]=useState({BULLETIN:0,WORSHIP:0});
 const [result,setResult]=useState<Bundle|null>(null);
 const last=useRef<{scope:string;pages:typeof pages;data:Bundle}|null>(null);
 const [loadedKey,setLoadedKey]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');const [reload,setReload]=useState(0);
 const [edit,setEdit]=useState<WorshipManagementRow|null>(null);const [saving,setSaving]=useState(false);const [saveError,setSaveError]=useState('');const dialog=useRef<HTMLDialogElement>(null);
 const requestKey=`${month}:${pages.BULLETIN}:${pages.WORSHIP}:${reload}`;const loading=loadedKey!==requestKey;
 useEffect(()=>{
  const controller=new AbortController();const scope=`${month}:${reload}`;
  async function read(){
   const previous=last.current;
   const changed=(['BULLETIN','WORSHIP'] as const).filter(kind=>!previous||previous.scope!==scope||previous.pages[kind]!==pages[kind]);
   let data:Bundle;
   if(previous&&changed.length===1){const kind=changed[0];const part=worshipManagementPage.parse(await load({month,kind,page:String(pages[kind])},controller.signal));data={...previous.data,[kind]:part};}
   else data=worshipManagementBundle.parse(await load({month,kind:'ALL',bulletinPage:String(pages.BULLETIN),worshipPage:String(pages.WORSHIP)},controller.signal));
   if(!controller.signal.aborted){last.current={scope,pages,data};setResult(data);setError('');}
  }
  void read().catch(e=>{if(!controller.signal.aborted){setResult(null);setError(e instanceof Error?e.message:'자료를 불러오지 못했습니다.');}}).finally(()=>{if(!controller.signal.aborted)setLoadedKey(requestKey);});return()=>controller.abort();
 },[month,pages,reload,requestKey]);
 useEffect(()=>{if(edit)dialog.current?.showModal();else dialog.current?.close();},[edit]);
 function open(row:WorshipManagementRow){setEdit({...row});setSaveError('');}
 async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!edit)return;setSaving(true);setSaveError('');try{
  const response=await fetch('/api/v1/worship',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:edit.id,expectedUpdatedAt:edit.updatedAt,title:edit.title,worshipDate:edit.date,summary:edit.summary,status:edit.status,worshipContentId:edit.worshipContentId,publishConfirmed:new FormData(event.currentTarget).get('publishConfirmed')==='on'})});
  const value=await response.json();if(!response.ok||value.saved!==true)throw new Error(value.message??'저장하지 못했습니다.');dialog.current?.close();setEdit(null);setNotice('주보 원본을 저장했습니다. 홈페이지·앱에도 같은 공개 자료가 표시됩니다.');setReload(v=>v+1);
 }catch(e){setSaveError(e instanceof Error?e.message:'저장하지 못했습니다.');}finally{setSaving(false);}}
 return <><div className="pastoral-toolbar"><label>자료 월<input type="month" value={month} required onChange={e=>{if(e.target.value){setMonth(e.target.value);setPages({BULLETIN:0,WORSHIP:0});}}}/></label><button className="button" onClick={()=>setReload(v=>v+1)}>새로고침</button><BulletinPdfEditor month={month} onSaved={()=>{setNotice('주보를 등록했습니다.');setReload(v=>v+1);}}/><WorshipVideoEditor month={month} onSaved={()=>{setNotice('말씀 원본을 저장했습니다. 홈페이지·앱에 같은 공개 상태가 반영됩니다.');setReload(v=>v+1);}}/></div>
 <p className="muted">기존 자료를 복사하지 않고 원본을 관리합니다. 주보와 말씀을 이 화면에서 등록·수정하고 예배 기록에 연결할 수 있습니다. 같은 날짜의 자료라도 자동으로 같은 예배에 연결하지 않습니다.</p><p role="status">{notice}</p>
 <WorshipSessions key={month} month={month} materials={result&&!loading?[...result.BULLETIN.data,...result.WORSHIP.data]:[]} canPrint={canPrint}/>
 {loading?<section className="panel detail-body" aria-busy="true"><h2>주보와 말씀</h2><p role="status">선택한 달의 자료를 불러오는 중…</p></section>:error?<p role="alert">{error}</p>:result&&(['BULLETIN','WORSHIP'] as const).map(kind=><section key={kind} className="panel detail-body"><h2>{kind==='BULLETIN'?'주보':'말씀·영상'}</h2>{!result[kind].data.length?<p className="empty">이 달에 등록된 {kind==='BULLETIN'?'주보가':'말씀이'} 없습니다.</p>:<ul className="history-list">{result[kind].data.map(row=><li key={row.id}><div className="section-heading"><div><p className="muted">{row.date} · {labels[row.status]}{kind==='WORSHIP'&&` · ${types[row.type]??row.type}`}</p><strong>{row.title}</strong>{kind==='BULLETIN'?<p>{row.worshipContentId?`연결된 말씀: ${row.linkedTitle??'현재 확인할 수 없는 자료'}`:'말씀 연결 없음'}</p>:<p>{[row.preacher,row.scripture].filter(Boolean).join(' · ')}</p>}</div>{kind==='BULLETIN'?<div className="chips"><button className="button" onClick={()=>open(row)}>정보·말씀 연결</button><BulletinPdfEditor row={row} month={month} onSaved={()=>{setNotice('주보 파일을 교체했습니다. 이전 파일은 이력에 보관됩니다.');setReload(v=>v+1);}}/></div>:<WorshipVideoEditor id={row.id} month={month} onSaved={()=>{setNotice('말씀을 저장했습니다.');setReload(v=>v+1);}}/>}{canDelete&&<WorshipSourceDelete row={row} onSaved={()=>{setNotice('자료를 목록과 공개 화면에서 숨겼습니다.');setReload(v=>v+1);}}/>}</div></li>)}</ul>}<div className="chips">{pages[kind]>0&&<button className="button" onClick={()=>setPages(v=>({...v,[kind]:v[kind]-1}))}>이전</button>}{result[kind].nextPage!==null&&<button className="button" onClick={()=>setPages(v=>({...v,[kind]:result[kind].nextPage!}))}>다음</button>}<span>{pages[kind]+1}페이지</span></div></section>)}
 <dialog ref={dialog} className="pastoral-dialog" onCancel={e=>{if(saving)e.preventDefault();else setEdit(null);}}><form onSubmit={save}><div className="section-heading"><h2>주보 정보·말씀 연결</h2><button type="button" className="button" disabled={saving} onClick={()=>{dialog.current?.close();setEdit(null);}}>닫기</button></div>{edit&&<fieldset className="pastoral-fields" disabled={saving}><label>주보 제목<input required maxLength={160} value={edit.title} onChange={e=>setEdit({...edit,title:e.target.value})}/></label><label>예배 날짜<input required type="date" value={edit.date} onChange={e=>setEdit({...edit,date:e.target.value})}/></label><label>공개 안내<textarea maxLength={1000} value={edit.summary} onChange={e=>setEdit({...edit,summary:e.target.value})}/></label><label>연결할 말씀<select value={edit.worshipContentId??''} onChange={e=>setEdit({...edit,worshipContentId:e.target.value||null})}><option value="">연결하지 않음</option>{edit.worshipContentId&&!result?.WORSHIP.data.some(r=>r.id===edit.worshipContentId)&&<option value={edit.worshipContentId}>{edit.linkedTitle??'기존 연결 유지'}</option>}{result?.WORSHIP.data.map(r=><option key={r.id} value={r.id}>{r.date} · {r.title} ({labels[r.status]})</option>)}</select></label><p className="muted">목록에 표시된 달·페이지의 말씀에서 선택합니다. 다른 자료는 창을 닫고 월 또는 말씀 페이지를 변경해 주세요. 연결만으로 비공개 말씀이 공개되지는 않습니다.</p><label>공개 상태<select value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value as WorshipManagementRow['status']})}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>{edit.status==='PUBLISHED'&&<label className="check"><input required type="checkbox" name="publishConfirmed"/>제목·안내·주보를 홈페이지와 앱에 공개합니다.</label>}<p className="muted">새 파일은 목록의 PDF 교체에서 올릴 수 있습니다. 현재·이전 PDF는 아래에서 확인하세요.</p><BulletinHistory key={edit.id} row={edit} onBusy={setSaving} onRestored={()=>{setEdit(null);setNotice("이전 주보 파일로 복원했습니다.");setReload(v=>v+1);}}/><p role="alert">{saveError}</p><button className="button primary">{saving?'저장 중…':'저장'}</button></fieldset>}</form></dialog></>;
}
