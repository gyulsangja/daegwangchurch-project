import type { PaperReceipt } from '@daegwang/contracts/finance';

type Line = Pick<PaperReceipt,'date'|'amount'|'description'|'goods'>;
const original = 'https://www.law.go.kr/LSW/flDownload.do?bylClsCd=110202&flSeq=160271005';
const money=(n:number)=>n.toLocaleString('ko-KR');
const dateText=(day:string)=>day.split('-').map((v,i)=>Number(v)+['년','월','일'][i]).join(' ');

export function previewGiftForm(name:string, entries:Line[], receipt?:PaperReceipt, previewIssuer?:PaperReceipt['issuer']) {
  const tab=window.open('about:blank','_blank');
  if(!tab)return false;
  tab.opener=null;
  const doc=tab.document, issuer=receipt?.issuer??previewIssuer;
  doc.documentElement.lang='ko';
  doc.title='기부금영수증 '+(receipt?.serial??'검토용');
  function el<K extends keyof HTMLElementTagNameMap>(tag:K, text='',parent?:HTMLElement) {
    const node=doc.createElement(tag); node.textContent=text;parent?.append(node);return node;
  }
  const style=el('style','',doc.head);
  style.textContent=`
    @page{size:A4;margin:14mm} *{box-sizing:border-box}body{margin:0;font:10pt/1.55 "Malgun Gothic","Apple SD Gothic Neo",sans-serif;color:#171717;background:#eee}
    article{max-width:210mm;margin:6mm auto;background:white;padding:14mm;break-after:page}article:last-child{break-after:auto}
    h1{text-align:center;font-size:23pt;letter-spacing:.12em;margin:4mm}h2{font-size:12pt;margin:4mm 0 1mm}
    table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #777;padding:1.8mm;overflow-wrap:anywhere}th{background:#f4f4f4;text-align:left}
    .lines th:nth-child(3){width:17%}.lines th:nth-child(5){width:8%}.lines td:nth-child(3){white-space:nowrap}.lines td,.lines th{text-align:center}.lines td:last-child{text-align:right;font-variant-numeric:tabular-nums}
    .signature{border-top:1px solid #777;margin-top:3mm;padding-top:2mm}.sign{text-align:right;margin:2mm 0}.seal{height:15mm;width:15mm;object-fit:contain;vertical-align:middle}
    .controls{background:white;padding:12px;display:flex;flex-wrap:wrap;align-items:center;gap:12px}.controls label{display:grid}.controls input,.controls button{padding:8px}.private{visibility:hidden}
    .review{font-weight:bold;color:#852800}.caption{font-size:9pt}.serial{text-align:right}tr,.signature{break-inside:avoid}
    @media print{body{background:white}.controls{display:none}article{margin:0;padding:0;max-width:none}.private{visibility:visible}}
  `;
  const toolbar=el('form','',doc.body);toolbar.className='controls';toolbar.autocomplete='off';
  function input(label:string, masked=false){
    const field=el('input','',el('label',label,toolbar));field.required=!!receipt;field.autocomplete='off';
    if(masked){field.type='password';field.inputMode='numeric';field.pattern='[0-9]{6}-?[0-9]{7}';field.maxLength=14;}else field.maxLength=160;
    return field;
  }
  const number=input('주민등록번호',true),address=input('기부자 주소');
  el('small','인쇄 창에서 입력한 정보는 출력물과 PDF에 표시됩니다.',toolbar);
  const help=el('a','공식 서식·작성방법',toolbar);help.href=original;help.target='_blank';help.rel='noopener noreferrer';
  const print=el('button','인쇄 / PDF로 저장',toolbar);print.type='submit';
  const personal:{number:HTMLElement;address:HTMLElement}[]=[];
  function fill(){const digits=number.value.replace('-','');for(const item of personal){item.number.textContent=digits.length===13?digits.slice(0,6)+'-'+digits.slice(6):'';item.address.textContent=address.value;}}
  function clear(){number.value='';address.value='';fill();}
  tab.addEventListener('beforeprint',fill);tab.addEventListener('afterprint',clear);tab.addEventListener('pagehide',clear);
  toolbar.onsubmit=e=>{e.preventDefault();fill();tab.print();};
  const day=receipt?.issued??new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
  const items=[...entries].sort((a,b)=>a.date.localeCompare(b.date));
  for(let i=0;i<items.length;i+=6){
    const page=el('article','',doc.body);
    el('small','소득세법 시행규칙 별지 제45호의2서식 (2026. 1. 2. 개정)',page);
    el('div',receipt?'일련번호 '+receipt.serial:'검토용 · 미발급',page).className=receipt?'serial':'review';
    el('h1','기부금 영수증',page);
    function section(title:string){el('h2',title,page);return el('table','',page);}
    function row(table:HTMLTableElement, ...cells:string[]){const tr=table.insertRow();return cells.map((v,j)=>el(j%2?'td':'th',v,tr));}
    const donor=section('① 기부자');
    const n=row(donor,'성명',name,'주민등록번호','')[3];
    const ad=row(donor,'주소','')[1] as HTMLTableCellElement;ad.colSpan=3;n.className=ad.className='private';personal.push({number:n,address:ad});
    const org=section('② 기부금 단체');
    row(org,'단체명',issuer?.name??'대광교회','사업자등록번호(고유번호)',issuer?.registration??'');
    row(org,'소재지',issuer?.address??'','기부금단체 근거법령',issuer?.legal_basis??'');
    const collector=section('③ 기부금 모집처');row(collector,'단체명','','사업자등록번호','');(row(collector,'소재지','')[1] as HTMLTableCellElement).colSpan=3;
    const lines=section('④ 기부 내용');lines.className='lines';
    const header=lines.createTHead().insertRow();for(const h of ['코드','구분','연월일','품명','수량','단가(원)','금액(원)'])el('th',h,header);
    const body=lines.createTBody();
    for(const line of items.slice(i,i+6)){
      const tr=body.insertRow();for(const value of [issuer?.gift_code??'',line.goods?'현물':'금전',line.date,line.goods?line.description??'':'',line.goods?money(line.goods.quantity):'',line.goods?money(line.goods.unitPrice):'',money(line.amount)])el('td',value,tr);
    }
    const subtotal=lines.createTFoot().insertRow();el('th',items.length>6?'이 쪽 합계':'합계',subtotal).colSpan=6;el('td',money(items.slice(i,i+6).reduce((s,v)=>s+v.amount,0)),subtotal);
    el('p','「소득세법」 제34조, 「조세특례제한법」 제58조·제76조·제88조의4 및 「법인세법」 제24조에 따른 기부금을 위와 같이 기부하였음을 증명하여 주시기 바랍니다.',page).className='signature';
    el('p',dateText(day)+'　 신청인　'+name+'　 (서명 또는 인)',page).className='sign';
    el('p','위와 같이 기부금을 기부받았음을 증명합니다.',page).className='signature';
    const sign=el('p',dateText(day)+'　 기부금 수령인　'+[issuer?.name,issuer?.recipient].filter(Boolean).join(' ')+'　',page);sign.className='sign';
    if(receipt && issuer?.seal?.startsWith('data:image/png;base64,')){const img=el('img','',sign);img.src=issuer.seal;img.alt='수령인 직인';img.className='seal';}else sign.append('(서명 또는 인)');
    const notes=items.slice(i,i+6).filter(e=>!e.goods&&e.description);if(notes.length)el('p','기부 명세　'+notes.map(v=>v.date+' '+v.description).join(' / '),page).className='caption';
    if(items.length>6)el('small',String(i/6+1)+' / '+Math.ceil(items.length/6),page);
  }
  return true;
}
