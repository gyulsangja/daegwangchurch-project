'use client';
import {useEffect,useState} from 'react';
import type {PaperReceipt} from '@daegwang/contracts/finance';
import {previewGiftForm} from './finance-receipt';
type Props={year:number;version:number;save:(p:Record<string,unknown>)=>Promise<boolean>};
const amount=(v:number)=>v.toLocaleString('ko-KR');
export function ReceiptRegister({year,version,save}:Props){
  const [view,setView]=useState('ledger'),[records,setRecords]=useState<PaperReceipt[]|null>(null);
  const [selected,setSelected]=useState<PaperReceipt|null>(null),[message,setMessage]=useState(''),[retry,setRetry]=useState(0);
  const basis=view==='summary'?'issue':'ledger';
  useEffect(()=>{
    const controller=new AbortController();
    setRecords(null);setMessage('');setSelected(null);
    fetch('/api/v1/finance?year='+year+'&register='+basis,{signal:controller.signal,cache:'no-store'})
      .then(async response=>{if(!response.ok)throw Error('발급 대장을 불러오지 못했습니다.');return response.json() as Promise<PaperReceipt[]>})
      .then(rows=>{if(!controller.signal.aborted)setRecords(rows)})
      .catch(()=>{if(!controller.signal.aborted)setMessage('발급 대장을 불러오지 못했습니다.')});
    return ()=>controller.abort();
  },[year,version,basis,retry]);
  const active=records?.filter(r=>!r.voided)??[];
  const sum=(rows:PaperReceipt[])=>rows.reduce((n,r)=>n+r.amount,0);
  return <section className="receipt-register">
    <div className="finance-actions finance-no-print"><label>자료<select value={view} onChange={e=>{setView(e.target.value);setSelected(null)}}><option value="ledger">발급·취소 이력</option><option value="detail">기부자별 발급명세 작성용</option><option value="summary">연간 발급합계표 작성용</option></select></label>
    <button className="button" disabled={!records} onClick={()=>window.print()}>인쇄 / PDF 저장</button></div>
    <h3>{year}년 {view==='summary'?'발급분 · 합계표 작성 자료':view==='detail'?'기부 귀속분 · 기부자별 발급명세':'기부 귀속분 · 발급 대장'}</h3>
    {message&&<p role="alert">{message} <button onClick={()=>setRetry(retry+1)}>다시 조회</button></p>}
    {!records&&!message&&<p role="status">대장을 불러오는 중…</p>}
    {records && <>{view==='summary'?<>
      <p>발급일 기준 개인 서면 영수증입니다. 취소 건과 전자 발급분은 별도로 대조하세요.</p>
      <div className="finance-table"><table><thead><tr><th>기부금 코드</th><th>유효 건수</th><th>유효 금액</th></tr></thead><tbody>{Array.from(new Set(active.map(r=>r.issuer.gift_code))).sort().map(code=>{const rows=active.filter(r=>r.issuer.gift_code===code);return <tr key={code}><td>{code}</td><td>{rows.length}</td><td>{amount(sum(rows))}원</td></tr>})}</tbody><tfoot><tr><th>합계</th><td>{active.length}</td><td>{amount(sum(active))}원</td></tr></tfoot></table></div>
      <p>취소 {records.length-active.length}건 · {amount(sum(records)-sum(active))}원</p>
    </>:<div className="finance-table"><table><thead><tr>{['발급번호','기부일 / 발급일','기부자','내용 / 코드','금액',...(view==='detail'?['주민·사업자등록번호','주소']:['상태·처리'])].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{(view==='detail'?active:records).map(r=><tr key={r.serial}><td>{r.documentNo??r.serial}</td><td>{r.date}<small>{r.issued}</small></td><td>{r.name}</td><td>{r.description||'기부금'}<small>{r.issuer.gift_code}</small></td><td>{amount(r.amount)}</td>{view==='detail'?<><td></td><td></td></>:<td>{r.voided?<><strong>취소</strong><small>{r.voidReason} {r.voidAt&&new Date(r.voidAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} {r.voidBy}</small></>:<>발급 <span className="finance-no-print"><button className="button" onClick={()=>{if(!previewGiftForm(r.name,[r],r))setMessage('인쇄 창을 열도록 허용해 주세요.')}}>재인쇄</button> <button className="button" onClick={()=>setSelected(r)}>발급 취소</button></span></>}</td>}</tr>)}</tbody></table></div>}
    {!records.length&&<p>발급 기록이 없습니다.</p>}
    {view==='detail'&&<p>번호와 주소는 인쇄 후 보완하거나 기부자용 영수증과 동일한 보관용 사본을 편철하세요.</p>}
    {view!=='ledger'&&<p>공식 서식　<a href="https://www.law.go.kr/LSW/flDownload.do?flSeq=164444095">소득세법 시행규칙 별지 제29호의7</a> · <a href="https://www.law.go.kr/lsLawLinkInfo.do?lsJoLnkSeq=1000118765">법인세법 시행규칙 발급합계표</a></p>}
    </>}
    {selected&&<form className="finance-no-print" onSubmit={async e=>{e.preventDefault();const reason=new FormData(e.currentTarget).get('reason');if(await save({action:'RECEIPT_CANCEL',serial:selected.serial,reason}))setSelected(null)}}>
      <label>{selected.documentNo??selected.serial} 취소 사유<input name="reason" required maxLength={300}/></label><p>원본을 회수하거나 기부자에게 취소를 알리세요. 정정본은 새 번호로 발급합니다.</p><button className="button">취소 확정</button> <button className="button" type="button" onClick={()=>setSelected(null)}>닫기</button></form>}
  </section>;
}
