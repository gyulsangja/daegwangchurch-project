import {requireIsolatedMinistryServer} from './ministry-browser-guard.mjs';
// Run against a separate MINISTRY_LOCAL_DB_PATH, never the user's review DB.
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:3002';await requireIsolatedMinistryServer(base);
const browser=await chromium.launch({channel:'msedge',headless:true});
mkdirSync('test-results/ministry',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.getByRole('heading',{name:'오늘의 목회'}).waitFor();
 assert.equal(await page.locator('img[alt="대광교회 로고"]').getAttribute('src'),'/logo.svg');
 await page.goto(`${base}/plans`);await page.getByRole('button',{name:'목회 목표 등록'}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('제목',{exact:true}).fill('가상 목회 목표');await dialog.getByLabel('목표와 기대하는 변화').fill('한 사람의 이야기를 기억하기');await dialog.getByRole('button',{name:'저장',exact:true}).click();
 await page.getByRole('button',{name:'가상 목회 목표',exact:true}).waitFor();
 await page.getByRole('button',{name:'실행 계획 등록'}).click();await dialog.getByLabel('제목',{exact:true}).fill('가상 심방 준비');await dialog.getByLabel('연결할 상위 목표 (선택)').selectOption({label:'가상 목회 목표'});await dialog.getByRole('button',{name:'저장',exact:true}).click();
 await page.getByRole('button',{name:'가상 심방 준비',exact:true}).click();await dialog.getByLabel('진행 상태').selectOption('DONE');await dialog.getByLabel('진행 내용·결과 (마무리할 때 필수)').fill('가상 수행 결과 기록');await dialog.getByRole('button',{name:'저장',exact:true}).click();
 await dialog.waitFor({state:'hidden'});await page.getByRole('button',{name:'전체',exact:true}).click();await page.getByText('연결 활동 완료 1 / 1').waitFor();
 await page.goto(`${base}/prayers`);await page.getByRole('button',{name:'기도제목 등록'}).click();await dialog.getByLabel('제목',{exact:true}).fill('가상 기도제목');await dialog.getByLabel('기도 내용').fill('목회자의 기록');await dialog.getByRole('button',{name:'저장',exact:true}).click();await page.getByRole('button',{name:'가상 기도제목',exact:true}).waitFor();
 await page.goto(`${base}/care`);await page.getByRole('button',{name:'상담·심방 등록'}).click();await dialog.getByLabel('제목',{exact:true}).fill('가상 심방 일정');await dialog.locator('summary').filter({hasText:'연결 대상'}).click();await dialog.getByRole('checkbox',{name:'가상교인 가람',exact:true}).check();await dialog.getByRole('button',{name:'저장',exact:true}).click();await page.getByRole('button',{name:'가상 심방 일정',exact:true}).waitFor();
 await page.goto(`${base}/attendance`);await page.getByRole('button',{name:'출석부 열기'}).click();await page.getByRole('group',{name:'가상교인 가람 출석',exact:true}).getByRole('button',{name:'현장 출석',exact:true}).click();await page.getByRole('group',{name:'가상교인 나래 출석',exact:true}).getByRole('button',{name:'온라인',exact:true}).click();await page.getByRole('group',{name:'가상교인 다온 출석',exact:true}).getByRole('button',{name:'결석',exact:true}).click();
 await page.getByRole('button',{name:'명단과 출석 저장'}).click();await page.getByText('3명의 출석을 저장했습니다.',{exact:true}).waitFor();await page.getByRole('button',{name:'통계·교인별 보기'}).click();await page.getByRole('heading',{name:'기간별 출석 통계'}).waitFor();assert.ok(await page.getByText('67%',{exact:true}).count()>0);
 await page.screenshot({path:'test-results/ministry/attendance-statistics-desktop.png',fullPage:true,caret:'initial'});
 await page.goto(`${base}/members/demo-member-1`);await page.getByRole('heading',{name:'이 교인의 출석 흐름'}).waitFor();assert.ok(await page.getByText('100%',{exact:true}).count()>0);
 await page.goto(base);await page.getByRole('link',{name:'가상 심방 일정 →',exact:true}).waitFor();await page.screenshot({path:'test-results/ministry/pastoral-home-desktop.png',fullPage:true,caret:'initial'});
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/','/attendance','/plans','/care','/members/demo-member-1']){await page.goto(`${base}${route}`);await page.locator('h1').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${route}`);}
 await page.goto(`${base}/attendance`);await page.getByRole('button',{name:'출석부 열기'}).click();await page.getByRole('group',{name:'가상교인 가람 출석',exact:true}).waitFor();await page.screenshot({path:'test-results/ministry/attendance-mobile.png',fullPage:true,caret:'initial'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);console.log('Pastoral goals, progress, prayer, care, attendance, member statistics and mobile layouts passed.');
}finally{await browser.close();}
