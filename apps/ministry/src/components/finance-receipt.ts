import type { FinanceEntry, PaperReceipt } from '@daegwang/contracts/finance';

export function previewGiftForm(name: string, entries: Pick<FinanceEntry,"date"|"amount">[], receipt?:PaperReceipt) {
  const tab = window.open('about:blank','_blank');
  if (!tab) return false;
  tab.opener = null;
  const doc = tab.document;
  doc.title = receipt?'기부금영수증 '+receipt.serial:'기부금영수증 검토용';
  const style = doc.createElement('style');
  style.textContent = `
    @page{size:A4;margin:0} *{box-sizing:border-box} body{margin:0;background:#ddd;font-family:sans-serif}
    article{width:210mm;height:297mm;background:white;position:relative;margin:0 auto;break-after:page}
    article:last-child{break-after:auto} img{width:100%;height:100%} span{position:absolute;font-size:9pt}
    strong{position:absolute;top:44%;left:25%;transform:rotate(-22deg);font-size:24pt;color:#752d20}
    button{padding:12px 20px;margin:8px} @media print{button{display:none}body{background:white}}
  `;
  doc.head.append(style);
  const button=doc.createElement('button');
  button.textContent=receipt?'발급본 인쇄 (주소·식별번호·서명은 서면 작성)':'검토용 인쇄';button.onclick=()=>tab.print();doc.body.append(button);
  function sheet(src:string){
    const page=doc.createElement('article');const img=doc.createElement('img');
    img.src=new URL(src,location.origin).href;img.alt='소득세법 시행규칙 별지 제45호의2';page.append(img);doc.body.append(page);return page;
  }
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date));
  for(let pos=0;pos<sorted.length;pos+=6){
    const page=sheet('/receipt-2026.png');
    function field(left:number,top:number,text:string){const span=doc.createElement('span');span.style.left=left+'%';span.style.top=top+'%';span.textContent=text;page.append(span);}
    field(20,19,name);field(20,28.7,receipt?.issuer.name??'대광교회');
    if(receipt){field(20,10,receipt.serial);field(76,28.8,receipt.issuer.registration);field(17,33,receipt.issuer.address);field(60,35,receipt.issuer.legal_basis);field(14,57.85,receipt.issuer.gift_code);const [year,month,day]=receipt.issued.split('-');field(76,88.4,year);field(82.7,88.4,month);field(88.2,88.4,day);field(51,92,receipt.issuer.name);}
    sorted.slice(pos,pos+6).forEach((e,i)=>{const y=57.85+i*2.37;field(28,y,'금전');field(37.6,y,e.date);field(83.4,y,e.amount.toLocaleString());});
    const mark=doc.createElement('strong');mark.textContent='검토용 · 미발급';if(!receipt)page.append(mark);
  }
  sheet('/receipt-instructions-2026.png');return true;
}
