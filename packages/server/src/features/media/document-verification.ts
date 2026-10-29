import type {documentTypes} from '@daegwang/contracts/document-upload';
// Structural format checks, not an antivirus scanner. Never render office files as HTML.
export function verifyDocumentBytes(bytes:Buffer,extension:keyof typeof documentTypes){
 let valid=false;
 if(extension==='pdf')valid=bytes.subarray(0,5).toString()==='%PDF-'&&bytes.subarray(-1024).includes(Buffer.from('%%EOF'));
 else if(extension==='hwp')valid=bytes.subarray(0,8).equals(Buffer.from('d0cf11e0a1b11ae1','hex'))&&bytes.includes(Buffer.from('HWP Document File'));
 else if(extension==='txt'){try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);valid=!bytes.includes(0);}catch{}}
 else {
  // Inspect the central directory without decompressing untrusted data.
  const end=bytes.lastIndexOf(Buffer.from('504b0506','hex'));const names:string[]=[];
  if(end>=0&&end+22<=bytes.length){let pos=bytes.readUInt32LE(end+16);const count=bytes.readUInt16LE(end+10);let total=0;valid=bytes.readUInt32LE(0)===0x04034b50&&count>0&&count<=2000;
   for(let i=0;valid&&i<count;i++){
    if(pos+46>end||bytes.readUInt32LE(pos)!==0x02014b50){valid=false;break;}
    const n=bytes.readUInt16LE(pos+28),extra=bytes.readUInt16LE(pos+30),comment=bytes.readUInt16LE(pos+32);total+=bytes.readUInt32LE(pos+24);
    if(pos+46+n+extra+comment>end||total>50*1024*1024){valid=false;break;}names.push(bytes.subarray(pos+46,pos+46+n).toString('utf8'));pos+=46+n+extra+comment;
   }
   const required={docx:'word/document.xml',xlsx:'xl/workbook.xml',pptx:'ppt/presentation.xml'}[extension];valid=valid&&names.includes('[Content_Types].xml')&&names.includes(required)&&!names.some(n=>/vbaProject\.bin$/i.test(n));
  }
 }
 if(!valid)throw Error('INVALID_DOCUMENT');
}
