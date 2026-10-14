import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const dir = 'apps/mobile/test-results/local-review'; await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:8081');
  await expect(page.getByText('첫시간 주님께', { exact: true }).first()).toBeVisible({ timeout: 90000 });
  await expect(page.getByText(/최근 묵상|오늘의 묵상/).first()).toBeVisible({ timeout: 30000 });
  await page.waitForFunction(() => [...document.images].filter(img => img.src.includes('ytimg.com')).every(img => img.complete && img.naturalWidth > 0));
  await page.screenshot({ path: `${dir}/app-home.png` });
  for (const width of [320, 390]) { await page.setViewportSize({ width, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await page.goto('http://localhost:8081/signup');
  await expect(page.getByText('이메일과 비밀번호로 시작하세요')).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: '가입하기', exact: true })).toBeDisabled();
  await page.screenshot({ path: `${dir}/signup.png` });
  // Exercise the completion UI without creating an account in the real project.
  await page.route('**/api/v1/account/signup', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, verificationRequired: false }) }));
  await page.getByRole('textbox', { name: '이메일', exact: true }).fill('ui-test@example.invalid');
  await page.getByLabel('비밀번호 · 8자 이상', { exact: true }).fill('ui-only-test-password');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('button', { name: '가입하기', exact: true }).click();
  await expect(page.getByText('가입이 완료됐어요')).toBeVisible();
  await page.unroute('**/api/v1/account/signup');
  await page.goto('http://localhost:8081/church-info/location');
  await page.locator('iframe[title="대광교회 위치 지도"]').waitFor({ timeout: 30000 });
  await expect(page.frameLocator('iframe').locator('#map canvas')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: `${dir}/map.png` });
  const list = await (await fetch('http://localhost:3001/api/v1/bulletins')).json();
  if (list.data[0]) {
    await page.goto(`http://localhost:8081/bulletins/${list.data[0].id}`);
    const doc = page.frameLocator('iframe[title="주보 문서"]');
    await expect(doc.locator('#pages')).toHaveText(/1 \/ \d+/, { timeout: 60000 });
    expect(await doc.locator('canvas').evaluate(el => el.width > 0 && el.height > 0)).toBe(true);
    await doc.getByRole('button', { name: '확대', exact: true }).click();
    await expect(doc.getByRole('button', { name: '축소', exact: true })).toBeEnabled();
    await page.screenshot({ path: `${dir}/bulletin.png` });
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000');
    await page.getByRole('heading', { level: 1 }).waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${dir}/website-${width}.png`, fullPage: true });
    console.log('website', width, 'height', await page.locator('body').evaluate(el => el.scrollHeight));
  }
  await page.goto('http://localhost:3001/admin/bulletins');
  await page.waitForURL('**/admin/login**');
  console.log('Local app, signup UI, map, PDF renderer, website and admin authentication gate verified.');
  console.log('Uncaught page errors:', errors);
} finally { await browser.close(); }
