import {requireIsolatedMinistryServer} from './ministry-browser-guard.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:3002';await requireIsolatedMinistryServer(base);
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const period=await (await page.request.get(`${base}/api/v1/years/2026`)).json();
 const reset=await page.request.post(`${base}/api/v1/years/2026/roster`,{headers:{Origin:base},data:{version:period.version,organizationId:'org-youth',members:[]}});assert.equal(reset.status(),200);
 await page.goto(`${base}/settings?tab=${encodeURIComponent('구성원 배정')}&organization=org-youth`);
 await page.locator('.roster-person').first().waitFor();
 const options=await page.getByRole('combobox',{name:'가상교인 가람 역할',exact:true}).locator('option').allTextContents();
 assert.deepEqual(options,['일반 구성원','회장','총무','회계']);
 for(const [name,role] of [['가람','LEADER'],['나래','SECRETARY'],['다온','TREASURER']]) {
   const row=page.locator('.roster-person').filter({hasText:`가상교인 ${name}`});await row.getByRole('checkbox').check();await row.getByRole('combobox').selectOption(role);
 }
 await page.getByLabel('교인 검색',{exact:true}).fill('가람');
 await page.getByRole('button',{name:'청년 모임 (예시) 배정 저장',exact:true}).click();
 await page.waitForEvent('load');await page.locator('.roster-person').first().waitFor();
 assert.equal(await page.getByRole('combobox',{name:'가상교인 나래 역할',exact:true}).inputValue(),'SECRETARY');
 assert.ok((await page.locator('.role-overview').innerText()).includes('가상교인 다온'));
 await page.getByRole('link',{name:'이 조직의 이름·유형·역할 설정 →'}).click();
 const org=page.locator('.org-edit').filter({has:page.getByRole('textbox',{name:'조직 이름',exact:true})}).first();
 await org.getByLabel('새 조직 역할 이름').fill('부회장');await org.getByRole('button',{name:'역할 추가',exact:true}).click();
 await page.getByRole('button',{name:'체계 저장',exact:true}).click();await page.waitForEvent('load');
 await page.getByRole('button',{name:'구성원 배정',exact:true}).click();
 assert.ok((await page.getByRole('combobox',{name:'가상교인 가람 역할',exact:true}).locator('option').allTextContents()).includes('부회장'));
 await page.screenshot({path:'test-results/ministry/roster-desktop.png',fullPage:true,caret:'initial'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/ministry/roster-mobile.png',fullPage:true,caret:'initial'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('Bulk assignments, filtered save preservation, role summaries, custom role and mobile layout passed.');
} finally {await browser.close();}
