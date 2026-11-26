import type {PaperReceipt} from '@daegwang/contracts/finance';
import type {ReceiptInput} from './finance-receipt-pdf';

export function previewGiftForm(name:string,entries:ReceiptInput['entries'],receipt?:PaperReceipt,issuer?:PaperReceipt['issuer']){
  const tab=window.open('about:blank','_blank');
  if(!tab)return false;
  tab.opener=null;
  const doc=tab.document;doc.documentElement.lang='ko';doc.title=receipt?'기부금 영수증 '+(receipt.documentNo ?? receipt.serial):'기부금 영수증 검토용';
  function el<K extends keyof HTMLElementTagNameMap>(tag:K,text:string,parent:HTMLElement){
    const node=doc.createElement(tag);node.textContent=text;parent.append(node);return node;
  }
  el('style',`
    *{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,sans-serif;color:#19362c;background:#f2f5f2}
    form{display:flex;gap:.8rem;align-items:end;flex-wrap:wrap;background:white;padding:1rem}
    label{display:grid}input,button,a{font:inherit;padding:.5rem;min-height:44px}button{cursor:pointer}iframe{width:100%;height:75vh;border:0}p{margin:.5rem 1rem}
  `,doc.head);
  const form=el('form','',doc.body);form.autocomplete='off';
  function input(label:string,masked=false){
    const box=el('input','',el('label',label,form));box.autocomplete='off';box.required=!!receipt;
    if(masked){box.type='password';box.inputMode='numeric';box.pattern='[0-9]{6}-?[0-9]{7}';box.maxLength=14;}else box.maxLength=160;return box;
  }
  const number=input('주민등록번호',true), address=input('기부자 주소');
  const generate=el('button',receipt?'발급본 PDF 만들기':'검토용 PDF 만들기',form);generate.type='submit';
  const download=el('a','PDF 다운로드',form);download.hidden=true;download.download=doc.title+'.pdf';
  const link=el('a','정부 원본·작성방법',form);link.href=new URL('/forms/donation-2026.pdf',location.origin).href;link.target='_blank';link.rel='noopener';
  const status=el('p','정부 원본 PDF를 여는 중…',doc.body);status.setAttribute('role','status');
  const frame=el('iframe','',doc.body);frame.title='기부금 영수증 PDF';
  let url='',revision=0;
  function discard(){if(url){URL.revokeObjectURL(url);url='';}download.removeAttribute('href');download.hidden=true;frame.removeAttribute('src');}
  async function render(final:boolean){
    const rev=++revision;generate.disabled=true;status.textContent='PDF를 준비하는 중…';
    try{
      const {createReceiptPdf}=await import('./finance-receipt-pdf');
      const blob=await createReceiptPdf({name,entries,receipt,issuer},final?number.value:'',final?address.value:'');
      if(rev!==revision||tab!.closed)return;
      discard();url=URL.createObjectURL(blob);frame.src=url;
      if(final||!receipt){download.href=url;download.hidden=false;}
      if(final){number.value='';address.value='';}
      status.textContent=final?'PDF가 준비되었습니다. 다운로드하거나 아래 PDF의 인쇄 버튼을 누르세요.':receipt?'인쇄용 개인정보를 입력한 뒤 발급본 PDF를 만드세요.':'검토용 미리보기입니다.';
    }catch(error){if(rev===revision){discard();status.textContent=error instanceof Error?error.message:'PDF를 만들지 못했습니다. 다시 시도해 주세요.';}}
    finally{if(rev===revision)generate.disabled=false;}
  }
  form.onsubmit=e=>{e.preventDefault();void render(true);};
  form.oninput=()=>{revision++;discard();generate.disabled=false;status.textContent='입력 후 PDF 만들기를 누르세요.';};
  tab.addEventListener('pagehide',()=>{revision++;discard();number.value='';address.value='';});
  // The first view of an issued receipt must not produce a partially filled signed original.
  if(receipt){frame.src=new URL('/forms/donation-2026.pdf',location.origin).href;status.textContent='인쇄용 개인정보를 입력한 뒤 발급본 PDF를 만드세요.';}
  else void render(false);
  return true;
}
