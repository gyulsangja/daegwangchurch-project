import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('apps/mobile/test-results', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage(); const errors = []; const writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/api/') && request.method() === 'POST') writes.push(request.url()); });
  const press = name => page.getByRole('button', { name, exact: true }).last().click();
  await page.goto('http://localhost:8088/');
  await press('잠시 기도하기');
  await page.getByText('잠시 마음을 모아요', { exact: true }).waitFor();
  await context.setOffline(true);
  await press('큰 글씨');
  await page.setViewportSize({ width: 320, height: 740 });
  for (const next of ['이 마음으로 기도하기', '기도를 마치고 일상으로']) {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await press(next);
  }
  await page.getByText('일상으로 이어가요', { exact: true }).waitFor();
  assert.equal(writes.length, 0, 'prayer guide creates no account or faith activity records');
  await page.screenshot({ path: 'apps/mobile/test-results/practice-large-320.png', fullPage: true });
  await context.setOffline(false);
  await press('개인 기도 남기기');
  await page.getByRole('button', { name: '로그인', exact: true }).waitFor();
  assert.ok(page.url().includes('kind=PRAYER'), 'optional record keeps requested prayer destination');
  await page.goto('http://localhost:8088/');
  await page.getByRole('button', { name: '잠시 기도하기', exact: true }).waitFor();
  await page.screenshot({ path: 'apps/mobile/test-results/faith-home-320.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: guest home → prayer → reflection → optional private record; offline guide, large text 320px, no writes.');
} finally { await browser.close(); }
