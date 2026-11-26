'use client';
import { useState } from 'react';
import type { PaperReceipt } from '@daegwang/contracts/finance';

async function readSeal(file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5_000_000)
    throw new Error('5MB 이하의 PNG, JPG 또는 WebP 파일을 선택하세요.');
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 220 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL('image/png');
    if (png.length > 90000) throw new Error('도장 주변 여백과 배경을 잘라서 다시 선택하세요.');
    return png;
  } finally { bitmap.close(); }
}

export function IssuerForm({issuer, save}:{issuer?:PaperReceipt['issuer']|null;save:(p:Record<string,unknown>)=>Promise<boolean>}) {
  const [seal,setSeal]=useState(issuer?.seal??null);
  const [basis,setBasis]=useState(issuer?.legal_basis??'');
  const [code,setCode]=useState(issuer?.gift_code??'');
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  return <form className="finance-form" onSubmit={async e=>{
    e.preventDefault(); const fields=Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true); try{await save({action:'ISSUER_SETUP',...fields,seal,confirmed:true});}finally{setBusy(false);}
  }}>
    <label>단체명<input required name="name" defaultValue={issuer?.name??'대광교회'} maxLength={100}/></label>
    <label>교회 고유번호 · 숫자 10자리<input required name="registration" defaultValue={issuer?.registration} pattern="[0-9]{10}" maxLength={10}/></label>
    <label>교회 주소<input required name="address" defaultValue={issuer?.address} maxLength={200}/></label>
    <label>수령인 · 대표자 성명<input required name="recipient" defaultValue={issuer?.recipient??''} maxLength={100}/></label>
    <button className="button" type="button" onClick={()=>{setBasis('법인세법 시행령 제39조제1항제1호마목');setCode('41');}}>종교단체 근거 법령·코드 불러오기</button>
    <label>공제 대상 근거 법령<input required name="legalBasis" value={basis} onChange={e=>setBasis(e.target.value)} maxLength={150}/></label>
    <label>기부금 유형 코드<input required name="giftCode" value={code} onChange={e=>setCode(e.target.value)} pattern="[0-9]{2}" maxLength={2}/></label>
    <label>확인한 근거 자료<input required name="reason" maxLength={300} placeholder="소속 증명서 등 자료명"/></label>
    <label>수령인 도장 이미지<input type="file" disabled={busy} accept="image/png,image/jpeg,image/webp" onChange={async e=>{
      const file=e.target.files?.[0]; if(!file)return; setBusy(true);setError('');
      try{setSeal(await readSeal(file));}catch(err){setError(err instanceof Error?err.message:'이미지를 읽지 못했습니다.');}finally{setBusy(false);}
    }}/></label>
    {seal&&<div><img src={seal} alt="등록할 수령인 도장" width={72} height={72} style={{objectFit:'contain'}}/> <button type="button" className="button" onClick={()=>{setSeal(null);setError('');}}>도장 제거</button></div>}
    {error&&<p role="alert">{error}</p>}
    <label><input type="checkbox" required/>해당 연도 발급 자격·근거 법령과 서면 발급 가능 여부를 확인했습니다.</label>
    <button className="button primary" disabled={busy||!!error}>발급 정보 저장</button>
  </form>;
}
