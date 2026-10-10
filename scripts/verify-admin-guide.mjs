import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Run with npm run dev:admin:preview. No login bypass or database mutations.
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('http://127.0.0.1:3001/preview/church-guide');
  assert.equal(response.status(), 200);
  await page.getByRole('heading', { name: '교회 안내', exact: true }).waitFor();
  const links = page.locator('main a');
  const expected = ['/admin/people', '/admin/ministries', '/admin/pages/home', '/admin/pages/church', '/admin/pages/vision', '/admin/pages/history', '/admin/pages/worship-info', '/admin/pages/newcomer-education'];
  assert.deepEqual(await links.evaluateAll(items => items.map(item => item.getAttribute('href'))), expected);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const link of await links.all()) assert.ok(await link.isVisible());
  }
  await page.getByRole('link', { name: /교회소개/ }).click();
  await page.waitForURL(url => url.pathname === '/admin/login');
  assert.deepEqual(errors, []);
  console.log('Church guide passed: real server-rendered page, 8 links, 3 widths and authenticated destination.');
} finally {
  await browser.close();
}
