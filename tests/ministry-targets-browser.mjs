import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {requireIsolatedMinistryServer} from './ministry-browser-guard.mjs';
const base='http://127.0.0.1:3002';await requireIsolatedMinistryServer(base);const browser=await chromium.launch({channel:'msedge',headless:true});mkdirSync('test-results/ministry',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));const title=`함께 드린 심방 ${Date.now()}`;
 await page.goto(`${base}/records?kind=CARE`);await page.waitForURL(`${base}/care`);
 assert.equal(await page.getByRole('link',{name:'상담·심방 결과를 교적에 기록'}).count(),0);
 await page.locator('.pastoral-toolbar').first().waitFor();
 assert.equal(await page.getByRole('button',{name:'상담·심방 등록',exact:true}).count(),1);
 await page.getByRole('button',{name:'상담·심방 등록',exact:true}).click();const dialog=page.getByRole('dialog');
 await dialog.locator('[name=title]').fill(title);await dialog.locator('[name=body]').fill('가정과 청년 모임을 함께 돌보았습니다.');await dialog.locator('summary').filter({hasText:'연결 대상'}).click();
 await dialog.getByRole('checkbox',{name:'가상교인 가람',exact:true}).check();await dialog.getByRole('button',{name:'가구',exact:true}).click();await dialog.getByRole('checkbox',{name:/가람·나래 가정/}).check();await dialog.getByRole('button',{name:'조직',exact:true}).click();await dialog.getByRole('checkbox',{name:/청년 모임/}).check();
 await dialog.locator('[name=status]').selectOption('DONE');await dialog.locator('[name=reflection]').fill('함께 기도하고 다음 만남을 정했습니다.');await page.screenshot({path:'test-results/ministry/targets-editor.png',fullPage:true,caret:'initial'});await dialog.getByRole('button',{name:'저장',exact:true}).click();await page.getByRole('button',{name:title,exact:true}).waitFor();
 for(const path of ['/members/demo-member-1','/members/demo-member-2','/families?family=family-demo','/organizations?organizationId=org-youth']){
  await page.goto(base+path);const link=page.getByRole('link',{name:`${title} →`,exact:true});await link.waitFor();assert.equal(await link.count(),1,path);
 }
 await page.getByRole('link',{name:`${title} →`,exact:true}).click();await dialog.waitFor();assert.equal(await dialog.locator('[name=title]').inputValue(),title);await dialog.locator('[name=reflection]').fill('후속 연락 완료');await dialog.getByRole('button',{name:'저장',exact:true}).click();await dialog.waitFor({state:'hidden'});
 await page.goto(`${base}/care?member=demo-member-1`);await dialog.waitFor();await dialog.getByRole('button',{name:'개인',exact:true}).click();assert.equal(await dialog.getByRole('checkbox',{name:'가상교인 가람',exact:true}).isChecked(),true);await dialog.getByRole('button',{name:'닫기',exact:true}).click();
 for(const route of ['/records','/records?kind=SERVICE','/statistics','/settings','/attendance','/care','/prayers','/plans','/families','/organizations']){const r=await page.goto(base+route);assert.equal(r.status(),200,route);await page.locator('h1').waitFor();}
 await page.setViewportSize({width:390,height:844});await page.goto(`${base}/care`);await page.getByRole('button',{name:'상담·심방 등록',exact:true}).click();await dialog.waitFor();assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1));await dialog.getByRole('button',{name:'닫기',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);console.log('PASS: unified completed care entry; individual/family/organization links; one record in each view; edit and register navigation; 10 routes; mobile form');
}finally{await browser.close();}
