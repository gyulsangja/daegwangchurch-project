'use client';
/* eslint-disable @next/next/no-img-element -- Public storage previews do not use the remote optimizer. */
import {useState} from 'react';
import {optimizeImage} from '@daegwang/web-ui/lib/optimize-image';
import {mediaPage,managedMedia,type ManagedMedia} from '@daegwang/contracts/media-management';
export function PublicImagePicker({onSelect,disabled=false,onBusyChange,maxSelection=1}:{onSelect:(media:ManagedMedia)=>void;disabled?:boolean;onBusyChange?:(busy:boolean)=>void;maxSelection?:number}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[gallery,setGallery]=useState<ManagedMedia[]|null>(null),[page,setPage]=useState(0),[next,setNext]=useState<number|null>(null),[query,setQuery]=useState('');
 const [failed,setFailed]=useState<File[]>([]);
 function progress(value:boolean){setBusy(value);onBusyChange?.(value);}
 async function post(body:object){const r=await fetch('/api/v1/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.message);return data;}
 async function upload(files:File[]){
  if(files.length>maxSelection){setMessage(`한 번에 ${maxSelection}개까지 선택해 주세요.`);return;}
  progress(true);setFailed([]);setGallery(null);
  let nextIndex=0,done=0;
  const results:(ManagedMedia|undefined)[]=new Array(files.length);
  const errors=new Map<number,string>();
  async function worker(){
   while(nextIndex<files.length){
    const i=nextIndex++,file=files[i];
    try{
     const prepared=await optimizeImage(file,1500*1024,true,2048);
     const signed=await post({operation:'PREPARE_IMAGE',name:prepared.name.slice(0,240),mimeType:prepared.type,size:prepared.size});
     const uploaded=await fetch(signed.uploadUrl,{method:'PUT',headers:{'Content-Type':prepared.type},body:prepared});
     if(!uploaded.ok)throw Error('파일 전송 실패');
     const completed=await post({operation:'COMPLETE_IMAGE',receipt:signed.receipt});
     results[i]=managedMedia.parse(completed.data);
    }catch(e){errors.set(i,e instanceof Error?e.message:'업로드 실패');}
    done++;setMessage('사진 처리 '+done+' / '+files.length);
   }
  }
  setMessage('사진 처리 0 / '+files.length);
  try{
   await Promise.all(Array.from({length:Math.min(3,files.length)},worker));
   for(const media of results)if(media)onSelect(media);
   setFailed(files.filter((_,i)=>errors.has(i)));
   setMessage(errors.size?'추가 '+(files.length-errors.size)+'장 · 실패 '+errors.size+'장 · '+Array.from(errors.entries()).map(([i,why])=>files[i].name+' ('+why+')').join(', '):files.length+'장을 추가했습니다. 게시물을 저장하면 반영됩니다.');
  }finally{progress(false);}
 }
 async function load(target=0){progress(true);setMessage('');try{const r=await fetch(`/api/v1/media?${new URLSearchParams({page:String(target),q:query})}`,{cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.message);const parsed=mediaPage.parse(data);setGallery(parsed.data);setPage(target);setNext(parsed.nextPage);}catch(e){setMessage(e instanceof Error?e.message:'이미지를 불러오지 못했습니다.');}finally{progress(false);}}
 return <div><p className="muted">공개용 사진만 선택해 주세요. 사진은 자동 축소되며 위치 등 원본 부가정보를 제거합니다. 파일 주소는 공개되므로 상담 자료는 올리지 마세요.</p><div className="chips"><label className="button">이미지 올리기<input aria-label="이미지 파일" type="file" accept="image/jpeg,image/png,image/webp" multiple={maxSelection>1} disabled={disabled||busy} style={{maxWidth:'100%'}} onChange={e=>{const files=Array.from(e.target.files??[]);e.target.value='';if(files.length)void upload(files);}}/></label><button className="button" type="button" disabled={disabled||busy} onClick={()=>void load()}>기존 이미지 선택</button></div><p role="status">{message}</p>{failed.length>0&&<button type="button" className="button" disabled={busy||disabled} onClick={()=>void upload(failed)}>실패한 사진 다시 올리기</button>}{gallery&&<section><div className="chips"><label>파일 이름 검색<input value={query} maxLength={100} onChange={e=>setQuery(e.target.value)}/></label><button type="button" className="button" disabled={busy} onClick={()=>void load()}>찾기</button><button type="button" className="button" disabled={busy} onClick={()=>setGallery(null)}>목록 닫기</button></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>{gallery.map(media=><button key={media.id} className="button" type="button" disabled={busy||disabled} data-editor-change onClick={()=>{onSelect(media);setGallery(null);}} style={{display:'block',minWidth:0}}>{/* User-selected public storage URL, not a Next remote optimizer. */}<img src={media.url} alt="" loading="lazy" style={{width:'100%',height:90,objectFit:'contain'}}/><span style={{overflowWrap:'anywhere'}}>{media.name}</span></button>)}</div>{!gallery.length&&<p>이미지가 없습니다.</p>}<div className="chips">{page>0&&<button type="button" className="button" disabled={busy} onClick={()=>void load(page-1)}>이전 이미지</button>}{next!==null&&<button type="button" className="button" disabled={busy} onClick={()=>void load(next)}>다음 이미지</button>}</div></section>}</div>;
}
