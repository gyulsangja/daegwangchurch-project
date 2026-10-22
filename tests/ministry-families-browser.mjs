import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:3002';const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/families?member=demo-member-3`);
 await page.getByLabel('가구 이름',{exact:true}).fill('가상 다온·라온 가정');
 await page.getByText('교인 검색·추가',{exact:true}).click();
 await page.getByRole('button',{name:'가상교인 라온 추가',exact:true}).click();
 await page.getByRole('combobox',{name:'기준 교인',exact:true}).selectOption('demo-member-3');
 await page.getByRole('combobox',{name:'가상교인 라온 관계',exact:true}).selectOption('배우자');
 await page.getByRole('button',{name:'가구 저장',exact:true}).click();
 await page.waitForURL(url=>url.searchParams.has('family'));await page.getByRole('heading',{name:'가구 정보 수정'}).waitFor();
 const familyId=new URL(page.url()).searchParams.get('family');
 await page.goto(`${base}/members/demo-member-4`);await page.getByRole('button',{name:'가족',exact:true}).click();
 await page.getByText('가상 다온·라온 가정',{exact:true}).waitFor();await page.getByText('배우자',{exact:true}).waitFor();
 await page.getByRole('link',{name:'가구·가족 관계 수정'}).click();await page.getByRole('heading',{name:'가구 정보 수정'}).waitFor();
 await page.screenshot({path:'test-results/ministry/families-desktop.png',fullPage:true,caret:'initial'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/ministry/families-mobile.png',fullPage:true,caret:'initial'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 page.on('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'가구 연결 해제',exact:true}).click();await page.waitForURL(url=>url.pathname==='/families'&&!url.searchParams.has('family'));
 const remaining=await(await page.request.get(`${base}/api/v1/families`)).json();assert.ok(!remaining.some(f=>f.id===familyId));
 await page.goto(`${base}/members/demo-member-4`);await page.getByRole('button',{name:'가족',exact:true}).click();await page.getByText('연결된 가족 정보가 없습니다.',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('Family create, relationship, member link, archive without deleting members, mobile layout passed.');
}finally{await browser.close();}
