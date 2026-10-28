'use client';
import {useEffect,useRef,useState} from 'react';
import type {WorshipManagementRow} from '@daegwang/contracts/worship-management';
export function WorshipSourceDelete({row,onSaved}:{row:WorshipManagementRow;onSaved:()=>void}){
 const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await fetch('/api/v1/worship',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'DELETE_SOURCE',id:row.id,kind:row.kind,expectedUpdatedAt:row.updatedAt,confirmed:true})});const data=await r.json();if(!r.ok||!data.saved)throw Error(data.message??'삭제하지 못했습니다.');setOpen(false);onSaved();}catch(e){setError(e instanceof Error?e.message:'삭제하지 못했습니다.');}finally{setBusy(false);}}
 return <><button className="button" onClick={()=>{setError('');setOpen(true);}}>삭제</button><dialog ref={dialog} className="pastoral-dialog" onCancel={e=>{if(busy)e.preventDefault();else setOpen(false);}}><form onSubmit={submit}><div className="section-heading"><h2>자료 삭제 확인</h2><button className="button" type="button" disabled={busy} onClick={()=>setOpen(false)}>닫기</button></div><div className="detail-body"><strong>{row.date} · {row.title}</strong><p>홈페이지·앱과 관리 목록에서 숨깁니다. 예배 운영 기록과 저장된 파일·이력은 지우지 않습니다.</p><label className="check"><input required type="checkbox" disabled={busy}/>이 자료를 삭제할 것을 확인합니다.</label><p role="alert">{error}</p><button className="button" disabled={busy}>{busy?'처리 중…':'삭제 확인'}</button></div></form></dialog></>;
}
