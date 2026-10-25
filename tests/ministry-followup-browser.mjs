// Requires a fresh isolated MINISTRY_LOCAL_DB_PATH.
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base='http://127.0.0.1:3002';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/attendance`);
 await page.getByRole('button',{name:'출석부 열기'}).click();
 await page.getByRole('button',{name:'명단과 출석 저장'}).click();
 await page.getByText(/명단 보존:/).waitFor();
 assert.equal(await page.getByRole('button',{name:'저장된 상태'}).isDisabled(),true);
 const response=await page.request.post(`${base}/api/v1/members/demo-member-1/records`,{headers:{Origin:base},data:{kind:'CARE',date:'2026-10-21',category:'VISIT',content:'Synthetic follow-up browser test',nextDate:'2026-10-25'}});
 assert.equal(response.status(),200);
 await page.goto(`${base}/care`);
 await page.getByRole('button',{name:'후속 일정으로 연결',exact:true}).click();
 await page.getByRole('button',{name:'연결된 후속 일정 보기',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('진행 상태').selectOption('DONE');
 await dialog.getByLabel('수행 기록·돌아보기 (상태 변경 시 필수)').fill('Synthetic follow-up completed');
 await dialog.getByRole('button',{name:'저장',exact:true}).click();
 await page.getByRole('button',{name:'연결된 후속 일정 보기',exact:true}).click();
 assert.equal(await dialog.getByLabel('진행 상태').inputValue(),'DONE');
 await dialog.getByRole('button',{name:'닫기',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'후속 일정으로 연결',exact:true}).count(),0);
 await page.goto(base);assert.equal(await page.getByRole('heading',{name:'개인 상담 기록의 후속 일정'}).count(),0);
 assert.deepEqual(errors,[]);console.log('Unmarked roster saved; care follow-up created, completed, linked and removed from pending home.');
}finally{await browser.close();}
