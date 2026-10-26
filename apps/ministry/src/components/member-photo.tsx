'use client';
/* eslint-disable @next/next/no-img-element */
export function MemberPhoto({value,onChange,onBusy,onError}:{value:string;onChange:(value:string)=>void;onBusy:(busy:boolean)=>void;onError:(message:string)=>void}){
 async function select(file:File|undefined){
  if(!file)return;
  onBusy(true);onError('');let url='';
  try{
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw new Error('20MB 이하 JPG·PNG·WebP 사진을 선택해 주세요.');
   url=URL.createObjectURL(file);const image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement('canvas');const scale=Math.min(1,480/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw new Error('사진을 처리하지 못했습니다.');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
   let result=canvas.toDataURL('image/jpeg',0.8);if(result.length>180000)result=canvas.toDataURL('image/jpeg',0.5);if(result.length>180000)throw new Error('사진을 더 작게 선택해 주세요.');onChange(result);
  }catch(error){onError(error instanceof Error?error.message:'사진을 읽지 못했습니다.');}finally{if(url)URL.revokeObjectURL(url);onBusy(false);}
 }
 return <div className="photo-editor">{value?<img className="member-photo" src={value} alt="교인 사진 미리보기"/>:<div className="member-photo photo-placeholder">사진 없음</div>}<label>교인 사진<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void select(e.target.files?.[0]);e.target.value='';}}/></label><p>사진은 자동 축소되며 저장 버튼을 누르면 반영됩니다. 공개 홈페이지에는 게시되지 않습니다.</p>{value&&<button className="button" type="button" onClick={()=>onChange('')}>사진 삭제</button>}</div>;
}
