import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('apps/mobile/test-results', { recursive: true });
assert.equal((await (await fetch('http://127.0.0.1:3210/api/v1/account/options')).json()).mode, 'preview');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } }); const errors = []; page.on('pageerror', error => errors.push(error.message));
  const press = async name => { const button = page.getByRole('button', { name, exact: true }).filter({ visible: true }).last(); await expect(button).toBeEnabled(); await button.press('Enter'); };
  await page.goto('http://localhost:8088'); await page.getByRole('heading', { name: '대한예수교장로회 대광교회', exact: true }).waitFor();
  await page.getByText('첫시간 주님께', { exact: true }).waitFor();
  const illustration = page.locator('img').filter({ visible: true }).last(); await expect(illustration).toBeVisible();
  await page.screenshot({ path: 'apps/mobile/test-results/brand-home.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: 'apps/mobile/test-results/brand-home-320.png' });
  await press('우리 모임 소식'); await page.getByText('공개 소식 · [예시] 전도회 함께하는 소식', { exact: true }).waitFor(); assert.equal(await page.getByText('소속 안내 · [예시] 전도회 소속 안내', { exact: true }).count(), 0); await press('로그인'); await press('테스트 계정 채우기'); await press('로그인'); await page.waitForURL(url => url.pathname === '/groups');
  const interest = page.getByRole('checkbox', { name: '[예시] 청년 모임', exact: true }); await interest.waitFor();
  if (await interest.isChecked()) { await interest.uncheck(); await press('모임 설정 저장'); await page.getByText('관심 모임과 알림 선택을 저장했습니다.', { exact: false }).waitFor(); }
  await page.getByRole('checkbox', { name: '[예시] 청년 모임', exact: true }).check(); await page.getByRole('switch', { name: '선택한 모임의 공개 소식 알림', exact: true }).check(); await press('모임 설정 저장'); await page.getByText('관심 모임과 알림 선택을 저장했습니다.', { exact: false }).waitFor();
  await page.getByRole('radio', { name: '관심 모임', exact: true }).check(); await page.getByText('공개 소식 · [예시] 청년 모임 함께하는 소식', { exact: true }).waitFor(); assert.equal(await page.getByText('소속 안내 · [예시] 청년 모임 소속 안내', { exact: true }).count(), 0);
  await page.getByRole('radio', { name: '내 소속', exact: true }).check(); await page.getByText('소속 안내 · [예시] 전도회 소속 안내', { exact: true }).waitFor(); await page.screenshot({ path: 'apps/mobile/test-results/groups-member.png' });
  await page.setViewportSize({ width: 1280, height: 1000 }); await page.goto('http://127.0.0.1:3001/preview/app-operations');
  await page.getByRole('combobox', { name: '열람 대상' }).click(); await page.getByRole('option', { name: '확인된 소속만 읽는 안내' }).click(); await page.getByRole('checkbox', { name: '홈페이지에도 공개' }).check(); await press('모임 공지 미리보기'); await page.getByText('소속 전용 안내는 공개 홈페이지에 발행할 수 없습니다.', { exact: true }).waitFor();
  await page.getByRole('checkbox', { name: '홈페이지에도 공개' }).uncheck(); await press('모임 공지 미리보기'); await page.getByRole('dialog', { name: '모임과 열람 대상을 확인해 주세요' }).waitFor(); await page.screenshot({ path: 'apps/mobile/test-results/groups-admin-confirm.png' }); await press('모임 공지 체험 확인'); await page.getByText('모임 공지 체험 완료 · 실제 발행·알림 0건', { exact: true }).waitFor();
  assert.deepEqual(errors, []); console.log('Brand and groups browser checks passed: 320px brand, login return, interest save/filter, membership separation, admin private/public guard and confirmation.');
} finally { await browser.close(); }
