import { chromium, expect } from '@playwright/test';
import { androidDownloadUrl } from '../apps/website/src/lib/app-download.ts';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const list = await (await fetch('http://localhost:3001/api/v1/bulletins')).json();
  if (!list.data[0]) throw new Error('A published bulletin is required for verification');
  await page.goto(`http://localhost:8081/bulletins/${list.data[0].id}`);
  await page.getByRole('button', { name: '주보 전체 화면 보기', exact: true }).click({ timeout: 60000 });
  const dialog = page.getByRole('dialog', { name: '주보 전체 화면', exact: true });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(Math.round(box.width)).toBe(390); expect(Math.round(box.height)).toBe(844);
  const doc = page.frameLocator('iframe[title="주보 전체 화면 문서"]');
  await expect(doc.locator('#pages')).toHaveText(/1 \/ \d+/, { timeout: 60000 });
  const nextPage = doc.getByRole('button', { name: '다음 페이지', exact: true });
  if (await nextPage.isEnabled()) {
    await nextPage.click(); await expect(doc.locator('#pages')).toHaveText(/2 \/ \d+/);
    await doc.getByRole('button', { name: '이전 페이지', exact: true }).click();
    await expect(doc.locator('#pages')).toHaveText(/1 \/ \d+/);
  }
  await doc.getByRole('button', { name: '확대', exact: true }).click();
  await expect(doc.getByRole('button', { name: '축소', exact: true })).toBeEnabled();
  await page.screenshot({ path: 'apps/mobile/test-results/local-review/app-bulletin-fullscreen.png' });
  await page.getByRole('button', { name: '주보 전체 화면 닫기', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: '주보 전체 화면 보기', exact: true }).click();
  await expect(doc.locator('#pages')).toHaveText(/1 \/ \d+/, { timeout: 60000 });
  await page.getByRole('button', { name: '주보 전체 화면 닫기', exact: true }).focus();
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:3000/app');
    await expect(page.getByRole('link', { name: 'Android 앱 다운로드', exact: true })).toHaveAttribute('href', androidDownloadUrl);
    await expect(page.getByRole('img', { name: '대광교회 앱 다운로드 안내 페이지 QR코드', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `apps/mobile/test-results/local-review/app-download-${width}.png`, fullPage: true });
  }
  await page.goto('http://localhost:3000');
  await expect(page.locator('footer a[href="/app"]').first()).toBeVisible();
  await expect(page.locator('nav[aria-label="자주 찾는 교회생활"] a[href="/app"]')).toBeVisible();
  console.log('PASS: app bulletin full screen, zoom, close/Escape; download page 320/390/1440; homepage links.');
} finally { await browser.close(); }
