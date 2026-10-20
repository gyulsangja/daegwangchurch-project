import { chromium } from 'playwright';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true, ...(process.env.TEST_BROWSER_CHANNEL ? {channel:process.env.TEST_BROWSER_CHANNEL} : {})});
try {
  const page = await browser.newPage();
  const source = readFileSync('apps/admin/src/lib/prepare-notice-attachments.ts','utf8').replace(/^import.*\n/, "const isNoticeImage = (type: string) => ['image/jpeg','image/png','image/webp'].includes(type);\n").replace('export async function prepareNoticeAttachments','async function prepareNoticeAttachments');
  await page.addScriptTag({ content: ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText });
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');canvas.width=3600;canvas.height=2400;
    const ctx=canvas.getContext('2d'); const pixels=ctx.createImageData(canvas.width,canvas.height);
    for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=Math.random()*256;pixels.data[i+1]=Math.random()*256;pixels.data[i+2]=Math.random()*256;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const form=new FormData();form.append('attachmentFiles',new File([blob],'large.png',{type:'image/png'}));
    form.append('attachmentFiles',new File(['sample'],'info.txt',{type:'text/plain'}));
    await prepareNoticeAttachments(form,()=>{});
    const files=form.getAll('attachmentFiles');const bitmap=await createImageBitmap(files[0]);
    const output={original:blob.size,compressed:files[0].size,width:bitmap.width,height:bitmap.height,type:files[0].type,document:await files[1].text()};bitmap.close();
    const invalid=new FormData();invalid.append('attachmentFiles',new File(['broken'],'broken.png',{type:'image/png'}));
    try {await prepareNoticeAttachments(invalid,()=>{});output.invalidRejected=false;}catch{output.invalidRejected=true;}
    const hugeDocument=new FormData();hugeDocument.append('attachmentFiles',new File([new Uint8Array(4*1024*1024)],'file.pdf',{type:'application/pdf'}));
    try {await prepareNoticeAttachments(hugeDocument,()=>{});output.documentRejected=false;}catch{output.documentRejected=true;}
    return output;
  });
  assert.ok(result.original>5*1024*1024);assert.ok(result.compressed<=900*1024);assert.ok(result.width<=2560);assert.equal(result.width/result.height,1.5);assert.equal(result.document,'sample');assert.ok(result.invalidRejected);assert.ok(result.documentRejected);console.log(JSON.stringify(result));
}finally{await browser.close();}

