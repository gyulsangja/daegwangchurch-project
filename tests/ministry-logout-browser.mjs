import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base='http://localhost:3002';const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const javaScriptEnabled of [true,false]){
  const context=await browser.newContext({javaScriptEnabled});const page=await context.newPage();
  const response=await page.goto(`${base}/access-denied`);assert.equal(response.status(),200);assert.equal(response.headers()['referrer-policy'],'same-origin');
  await context.addCookies(['ministry-auth.0','ministry-auth.1','other-app-session'].map(name=>({name,value:'invalid-test-cookie',url:base,httpOnly:true})));
  const request=page.waitForRequest(r=>r.url()===`${base}/api/auth/logout`&&r.method()==='POST');
  await page.locator('form button').click();assert.equal((await (await request).allHeaders()).origin,base);
  await page.waitForURL(`${base}/login`);await page.locator('input[name=email]').waitFor();
  const names=(await context.cookies()).map(c=>c.name);assert.ok(!names.some(n=>n.startsWith('ministry-auth')));assert.ok(names.includes('other-app-session'));
  for(const origin of ['null','https://outside.example'])assert.equal((await context.request.post(`${base}/api/auth/logout`,{headers:{Origin:origin},maxRedirects:0})).status(),403);
  assert.equal((await context.request.get(`${base}/api/v1/members`)).status(),401);await context.close();
 }
 console.log('PASS: access-denied logout with JS and native form, cookies cleared, login rendered, foreign/null origins denied');
}finally{await browser.close();}
