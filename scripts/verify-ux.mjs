import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const dir = 'apps/mobile/test-results'; await mkdir(dir, { recursive: true });
if (process.env.UX_ADMIN_ONLY !== '1') assert.equal((await (await fetch('http://127.0.0.1:3210/api/v1/account/options')).json()).mode, 'preview');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let page;
try {
  page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const press = name => page.getByRole('button', { name, exact: true }).filter({ visible: true }).last().press('Enter');
  const shot = async name => { await page.waitForTimeout(350); await page.screenshot({ path: `${dir}/ux-${name}.png` }); };
  if (process.env.UX_ADMIN_ONLY !== '1') {
  await page.goto('http://localhost:8088/care'); await page.getByText('함께 이야기 나누고 싶을 때', { exact: true }).waitFor();
  await press('내 요청 확인'); await press('로그인'); await press('테스트 계정 채우기'); await press('로그인'); await page.waitForURL(url => url.pathname === '/care/requests'); await press('뒤로');
  await press('나의 묵상'); await page.getByText('나의 묵상 · 캘린더', { exact: false }).waitFor(); await shot('calendar-empty'); await press('말씀에서 묵상 시작하기');
  await page.getByText('10월 2일 · [샘플] 내 안에 거하라 ›', { exact: true }).click(); await press('묵상 기록하기');
  await page.getByRole('textbox', { name: '나의 묵상', exact: true }).fill('가상 묵상 · 재로그인 후에도 이어쓰기');
  let expired = true;
  await page.route('**/api/v1/me/records', async route => { if (expired && route.request().method() === 'POST') return route.fulfill({ status: 401, headers: { 'Access-Control-Allow-Origin': 'http://localhost:8088', 'Content-Type': 'application/json' }, body: '{}' }); return route.continue(); });
  await press('묵상 저장'); await press('다시 로그인하고 이어쓰기'); await press('테스트 계정 채우기'); await press('로그인');
  await page.waitForURL(url => url.pathname === '/records/new'); assert.equal(await page.getByRole('textbox', { name: '나의 묵상', exact: true }).inputValue(), '가상 묵상 · 재로그인 후에도 이어쓰기');
  expired = false; await press('묵상 저장'); await page.waitForURL(url => /^\/records\/[a-z0-9-]+$/.test(url.pathname));
  await page.getByText('기록 날짜 / 수정일', { exact: true }).waitFor(); await page.waitForTimeout(350);
  await press('뒤로'); await page.waitForURL(url => url.pathname === '/records'); await page.getByRole('button', { name: /기록 [1-9][0-9]*개$/ }).first().waitFor(); await shot('reflection-calendar');
  await press('뒤로'); await page.getByRole('tab', { name: '홈 탭', exact: true }).press('Enter'); await page.getByText('오늘의 묵상을 기록했습니다', { exact: true }).waitFor(); await shot('home-written');
  await press('이 묵상을 기도로 이어가기'); await page.getByRole('textbox', { name: '오늘의 기도', exact: true }).waitFor(); await press('뒤로');
  await page.getByRole('tab', { name: '나의 탭', exact: true }).press('Enter'); await press('나의 일정'); await press('개인 일정 등록');
  await page.getByLabel('일정 제목', { exact: true }).fill('가상 일정 · 달력 표시'); await press('일정 저장'); await page.waitForURL(url => /^\/schedules\/[a-z0-9-]+$/.test(url.pathname)); await page.getByRole('button', { name: '일정 수정', exact: true }).waitFor(); await page.waitForTimeout(350); await press('뒤로'); await page.waitForURL(url => url.pathname === '/schedules');
  await page.getByRole('button', { name: /일정 [1-9][0-9]*개$/ }).first().waitFor(); await shot('schedule-calendar');
  await page.setViewportSize({ width: 320, height: 740 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await shot('schedule-320');
  await press('뒤로'); await press('앱 이용 안내'); await page.getByText('처음 오셨나요?', { exact: true }).waitFor(); await shot('help'); assert.deepEqual(errors, []);
  }
  await page.close();
  if (process.env.UX_MOBILE_ONLY === '1') { console.log('Mobile UX checks passed'); await browser.close(); process.exit(0); }
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3001/preview/app-operations'); await page.getByRole('heading', { name: '관리 홈', exact: true }).waitFor(); await shot('admin-operations');
  assert.equal(await page.getByRole('navigation', { name: '관리자 메뉴', exact: true }).getByRole('link').count(), 8);
  assert.equal(await page.getByRole('link', { name: '앱 운영 현황', exact: true }).count(), 0);
  assert.equal(await page.getByRole('checkbox', { name: '교회 앱', exact: true }).count(), 0);
  await page.getByRole('textbox', { name: '콘텐츠 제목', exact: true }).fill(''); await press('발행 전 미리보기'); await page.getByRole('alert').filter({ hasText: '제목·날짜' }).waitFor();
  await page.getByRole('textbox', { name: '콘텐츠 제목', exact: true }).fill('[가상] 발행 체험'); await press('발행 전 미리보기'); await page.getByRole('dialog').waitFor(); await shot('admin-confirm'); await press('돌아가서 수정');
  await press('발행 전 미리보기'); await press('체험 확인'); await page.getByText('발행 절차 체험 완료 · 실제 발행 0건', { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await shot('admin-mobile');
  await page.locator('summary').filter({ hasText: '관리자 메뉴 열기' }).click();
  assert.equal(await page.getByRole('navigation', { name: '모바일 관리자 메뉴', exact: true }).getByRole('link').count(), 8);
  await shot('admin-mobile-menu');
  await page.setViewportSize({ width: 320, height: 740 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto('http://127.0.0.1:3001/admin/app-operations'); await page.waitForURL(url => url.pathname === '/admin/login');
  assert.deepEqual(errors, []); console.log(process.env.UX_ADMIN_ONLY === '1' ? 'Admin UX checks passed: 8 navigation items, unified publication, validation, confirmation, 390/320px layout and auth gate.' : 'Mobile and admin UX checks passed.');
} catch (error) { if (page) { console.error(page.url(), (await page.locator('body').innerText()).slice(-2200)); await page.screenshot({ path: `${dir}/ux-failure.png` }); } throw error; }
finally { await browser.close(); }
