import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { PaperReceipt } from '@daegwang/contracts/finance';

type Line=Pick<PaperReceipt,'date'|'amount'|'description'|'goods'>;
export type ReceiptInput={name:string;entries:Line[];receipt?:PaperReceipt;issuer?:PaperReceipt['issuer']};
let assets:Promise<ArrayBuffer[]>|undefined;
function files(){
  if(!assets)assets=Promise.all(['donation-2026.pdf','Pretendard-Regular.ttf'].map(async file=>{
    const result=await fetch('/forms/'+file);if(!result.ok)throw Error('서식 파일을 읽지 못했습니다.');return result.arrayBuffer();
  })).catch(e=>{assets=undefined;throw e;});
  return assets;
}

export async function createReceiptPdf(input:ReceiptInput, number='', address=''){
  const [original,ttf]=await files();
  const source=await PDFDocument.load(original);
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(ttf,{subset:false});
  const digits=await pdf.embedFont(StandardFonts.Helvetica);
  const {receipt,name}=input, org=receipt?.issuer??input.issuer;
  const stamp=receipt&&org?.seal?await pdf.embedPng(org.seal):null;
  pdf.setTitle(receipt?'기부금 영수증 '+(receipt.documentNo ?? receipt.serial):'기부금 영수증 검토용');
  // Field bounds in PDF points measured on the unaltered 595 × 841 point government form.
  function field(page:PDFPage,value:string|undefined,x:number,top:number,width:number,height=17,align:'left'|'center'|'right'='left',singleLine=false){
    const text=value?.trim();if(!text)return;
    const face=/^[ -~]+$/.test(text)?digits:font;
    for(let size=9.5;size>=5.5;size-=0.25){
      if(singleLine && face.widthOfTextAtSize(text,size)>width)continue;
      const rows:string[]=[];let row='';
      for(const ch of text){if(row&&face.widthOfTextAtSize(row+ch,size)>width){rows.push(row);row='';}row+=ch;}if(row)rows.push(row);
      if(rows.length*size*1.18>height)continue;
      rows.forEach((v,i)=>{const w=face.widthOfTextAtSize(v,size);page.drawText(v,{font:face,size,x:x+(align==='right'?width-w:align==='center'?(width-w)/2:0),y:page.getHeight()-top-(height-rows.length*size*1.18)/2-size-i*size*1.18});});return;
    }
    throw Error('입력한 내용이 공식 서식의 칸보다 깁니다. 명칭 또는 주소 표기를 줄여 주세요.');
  }
  const entries=[...input.entries].sort((a,b)=>a.date.localeCompare(b.date));
  const day=(receipt?.issued??new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'})).split('-');
  const won=(n:number)=>n.toLocaleString('ko-KR');
  for(let i=0;i<entries.length;i+=6){
    const [page]=await pdf.copyPages(source,[0]);pdf.addPage(page);
    if(!receipt)page.drawText('검토용 · 미발급',{x:412,y:745,size:11,font,color:rgb(.48,.15,.1)});
    field(page,receipt?.documentNo ?? receipt?.serial,120,80,51,19,'center',true);
    field(page,name,124,148,138,28);field(page,number.replace(/^(\d{6})-?(\d{7})$/,'$1-$2'),353,148,195,28);
    field(page,address,123,177,427,30);
    field(page,org?.name,103,239,239,17);field(page,org?.registration,472,239,82,17);
    field(page,org?.address,108,274,233,20);field(page,org?.legal_basis,443,274,111,37);
    entries.slice(i,i+6).forEach((item,j)=>{
      const boundaries=[58,136,220,292,347,429,493,558];
      const rowEdges=[482,502,521,541,562,582,602];
      function cell(column:number,value:string|undefined,align:'center'|'right'|'left'='center',singleLine=true){
        const inset=align==='right'?6:4;
        field(page,value,boundaries[column]+inset,rowEdges[j],boundaries[column+1]-boundaries[column]-inset*2,rowEdges[j+1]-rowEdges[j],align,singleLine);
      }
      cell(0,org?.gift_code);cell(1,item.goods?'현물':'금전');cell(2,item.date);
      if(item.goods){cell(3,item.description,'center',false);cell(4,won(item.goods.quantity),'right');cell(5,won(item.goods.unitPrice),'right');}
      cell(6,won(item.amount),'right');
    });
    for(const y of [657,741]){field(page,day[0],445,y,30,16,'right');field(page,String(Number(day[1])),489,y,16,16,'right');field(page,String(Number(day[2])),520,y,17,16,'right');}
    field(page,name,305,676,178,29,'right');
    field(page,[org?.name,org?.recipient].filter(Boolean).join(' '),301,755,184,30,'right');
    if(stamp){const {width,height}=stamp.scaleToFit(35,35);page.drawImage(stamp,{x:518+(35-width)/2,y:54+(35-height)/2,width,height});}
  }
  const [instructions]=await pdf.copyPages(source,[1]);pdf.addPage(instructions);
  const notes=entries.filter(v=>!v.goods&&v.description);
  if(notes.length){let annex=pdf.addPage([595,841]);let top=56;
    for(const item of notes){if(top>745){annex=pdf.addPage([595,841]);top=56;}
      if(top===56){field(annex,receipt?'기부 명세 · 제'+(receipt.documentNo ?? receipt.serial)+'호':'기부 명세 · 검토용',58,top,490);top+=34;}
      field(annex,item.date+'　'+item.description+'　'+won(item.amount)+'원',58,top,490,40);top+=44;
    }
  }
  return new Blob([new Uint8Array(await pdf.save()).buffer],{type:'application/pdf'});
}
