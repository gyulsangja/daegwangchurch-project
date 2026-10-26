import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {requireIsolatedMinistryServer} from './ministry-browser-guard.mjs';
const base='http://127.0.0.1:3002';await requireIsolatedMinistryServer(base);
const browser=await chromium.launch({channel:'msedge',headless:true});mkdirSync('test-results/ministry',{recursive:true});
try{
 const page=await browser.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const routes=['/','/members','/members/new','/members/demo-member-1','/members/demo-member-1/edit','/families','/organizations','/settings','/settings?tab='+encodeURIComponent('조직 구성'),'/settings?tab='+encodeURIComponent('구성원 배정'),'/care','/prayers','/plans','/attendance','/records','/records?kind=SERVICE','/statistics','/print','/integration'];
 async function widthOK(label){const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&!e.closest('.attendance-table,.print-document,.table-wrap,.family-map');}).slice(0,6).map(e=>[e.tagName,e.className,e.getBoundingClientRect().right])}));assert.ok(overflow.scroll<=overflow.width+1,label+JSON.stringify(overflow));}
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});
  for(const path of routes){const r=await page.goto(base+path);assert.equal(r.status(),200,path);await page.locator('h1').first().waitFor();await widthOK(`${width} ${path}`);}
  console.log(`PASS: ${routes.length} routes at ${width}px`);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/members');
 assert.equal(await page.getByRole('navigation',{name:'목회 메뉴',exact:true}).isVisible(),false);
 await page.getByRole('button',{name:'전체 메뉴',exact:true}).click();const menu=page.getByRole('navigation',{name:'목회 메뉴',exact:true});assert.equal(await menu.getByRole('link').count(),8);
 for(const link of await menu.getByRole('link').all()){const r=await link.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=390&&r.height>=44);}
 await page.screenshot({path:'test-results/ministry/mobile-menu.png',fullPage:true});await menu.getByRole('link',{name:'목회 계획',exact:true}).click();await page.getByRole('heading',{name:'목회 계획',exact:true}).waitFor();assert.equal(await menu.isVisible(),false);
 const title=`모바일 계획 ${Date.now()}`;const dialog=page.getByRole('dialog');
 assert.equal(await page.getByRole('button',{name:'실행 계획 등록',exact:true}).count(),0);
 await page.getByRole('button',{name:'목회 계획 등록',exact:true}).click();await dialog.getByLabel('제목',{exact:true}).fill(title);await dialog.getByLabel('목표와 할 일',{exact:true}).fill('가정을 살피고 함께 기도합니다.');await dialog.getByRole('button',{name:'저장',exact:true}).click();await dialog.waitFor({state:'hidden'});
 const card=page.locator('article').filter({has:page.getByRole('button',{name:title,exact:true})});await card.getByRole('button',{name:'이 계획에 실천 추가'}).click();assert.ok(await dialog.locator('[name=goalId]').inputValue());await dialog.getByLabel('제목',{exact:true}).fill(title+' 실천');await dialog.getByRole('button',{name:'저장',exact:true}).click();await dialog.waitFor({state:'hidden'});await card.getByRole('button',{name:new RegExp('○ '+title+' 실천')}).waitFor();assert.equal(await page.getByRole('button',{name:title+' 실천',exact:true}).count(),0);
 await card.getByRole('button',{name:new RegExp('○ '+title+' 실천')}).click();await dialog.getByLabel('진행 상태').selectOption('DONE');await dialog.locator('[name=reflection]').fill('모바일에서 수행 완료');await dialog.getByRole('button',{name:'저장',exact:true}).click();await dialog.waitFor({state:'hidden'});await page.getByRole('button',{name:'전체',exact:true}).click();await card.getByText('연결 활동 완료 1 / 1').waitFor();
 await page.screenshot({path:'test-results/ministry/mobile-plans.png',fullPage:true});
 for(const [path,button] of [['/care','상담·심방 등록'],['/prayers','기도제목 등록'],['/records','새 교육 기록']]){
  await page.goto(base+path);await page.getByRole('button',{name:button,exact:true}).click();await dialog.waitFor();assert.ok(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  for(const control of await dialog.locator('input:not([type=checkbox]),select,textarea').all()){if(await control.isVisible())assert.ok(await control.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16));}
  await page.setViewportSize({width:320,height:500});assert.ok(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1));await dialog.getByRole('button',{name:'닫기',exact:true}).click();await page.setViewportSize({width:390,height:844});
 }
 await page.goto(base+'/attendance');await page.getByRole('button',{name:'출석부 열기'}).click();await page.getByRole('group',{name:'가상교인 가람 출석',exact:true}).waitFor();await widthOK('attendance open');await page.screenshot({path:'test-results/ministry/mobile-attendance.png',fullPage:true});
 await page.goto(base+'/settings?tab='+encodeURIComponent('조직 구성'));await page.locator('.org-card summary').first().click();await widthOK('organization editor');
 await page.goto(base+'/members');await page.locator('.member-table td[data-label="직분"]').first().waitFor();await page.screenshot({path:'test-results/ministry/mobile-members.png',fullPage:true});assert.equal(await page.locator('.member-table td[data-label="직분"]').first().isVisible(),true);
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.sidebar').isVisible(),false);await page.emulateMedia({media:'screen'});
 assert.deepEqual(errors,[]);console.log('PASS: mobile menu, one plan entry and nested practice completion, member cards, dialogs at keyboard height, attendance controls, organization editing, print isolation');
}finally{await browser.close();}
