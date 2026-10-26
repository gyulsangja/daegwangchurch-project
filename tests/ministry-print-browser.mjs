import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {requireIsolatedMinistryServer} from './ministry-browser-guard.mjs';
const base='http://127.0.0.1:3002';await requireIsolatedMinistryServer(base);
const browser=await chromium.launch({channel:'msedge',headless:true});
mkdirSync('test-results/ministry',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/members/new`);await page.locator('input[name=name]').fill('출력 사진 검증');
 const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=1600;const x=c.getContext('2d');x.fillStyle='#88aa88';x.fillRect(0,0,c.width,c.height);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('input[type=file]').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
 await page.locator('img.member-photo').waitFor();const photo=await page.locator('img.member-photo').getAttribute('src');assert.ok(photo.startsWith('data:image/jpeg;base64,'));assert.ok(photo.length<180000);
 await page.getByRole('button',{name:'교인 등록',exact:true}).click();await page.waitForURL(/\/members\/[^/?]+\?/);const id=new URL(page.url()).pathname.split('/').at(-1);await page.locator('img.member-photo').waitFor();await page.reload();await page.locator('img.member-photo').waitFor();
 for(const type of ['directory','member','care','prayer','plans','attendance','records','families','organizations']){const response=await page.goto(`${base}/print?type=${type}${type==='member'?`&memberId=${id}`:''}`);assert.equal(response.status(),200,type);await page.locator('.print-document').waitFor();assert.ok(await page.locator('.print-document h1').textContent());}
 await page.goto(`${base}/print?type=member&memberId=${id}`);await page.emulateMedia({media:'print'});assert.equal(await page.locator('.sidebar').isVisible(),false);await page.locator('.print-document img').waitFor();await page.pdf({path:'test-results/ministry/member-print.pdf',preferCSSPageSize:true,printBackground:true});await page.screenshot({path:'test-results/ministry/member-print.png',fullPage:true,caret:'initial'});
 await page.emulateMedia({media:'screen'});await page.goto(`${base}/print?type=attendance&blank=1`);await page.getByText('□ 현장　□ 온라인　□ 결석　□ 사유').first().waitFor();await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 await page.goto(`${base}/members/${id}/edit`);await page.getByRole('button',{name:'사진 삭제',exact:true}).click();await page.getByRole('button',{name:'변경 저장',exact:true}).click();await page.waitForURL(/\/members\/[^/?]+\?/);assert.equal(await page.locator('img.member-photo').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: photo resize/save/reload/delete, nine print forms, print CSS/PDF, blank attendance, mobile width');
}finally{await browser.close();}
