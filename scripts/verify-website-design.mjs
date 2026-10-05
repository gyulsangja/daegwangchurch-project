import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const origin = process.env.WEBSITE_URL || 'http://localhost:3000';
const output = 'apps/website/test-results';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const routes = ['/', '/about/church', '/about/vision', '/about/worship-info', '/newcomer/guide', '/news/notices', '/worship/sunday-morning', '/location', '/ministries/elementary'];
try {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, `${width} ${route}: HTTP status`);
      assert.equal(await page.locator('main h1').count(), 1, `${route}: one primary heading`);
      const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
      assert.ok(dimensions.page <= dimensions.viewport + 1, `${width} ${route}: horizontal overflow ${JSON.stringify(dimensions)}`);
      if (route === '/' && width !== 320) {
        for (const id of ['home-word', 'home-community', 'home-belong']) {
          assert.equal(await page.locator(`section[aria-labelledby="${id}"] h2`).count(), 1, `${id}: coherent content group`);
        }
        const headingFont = await page.locator('h1').evaluate(e => getComputedStyle(e).fontFamily);
        assert.ok(!/Batang|Myungjo|Noto Serif/i.test(headingFont), 'default heading uses sans-serif');
        assert.equal(await page.locator('.church-hero-image img').evaluate(image => image.complete && image.naturalWidth > 0), true);
        await page.screenshot({ path: `${output}/website-${width}.png`, fullPage: true });
      }
      if (route === '/about/vision' && width === 1440) await page.screenshot({ path: `${output}/website-vision.png`, fullPage: true });
    }
  }
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('href'), '#main-content', 'keyboard skip link first');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main-content', 'skip link focuses main');
  const summary = page.locator('header summary');
  await summary.click();
  assert.equal(await page.locator('header details').getAttribute('open'), '');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('header details').getAttribute('open'), null);
  await summary.click();
  await page.locator('nav[aria-label="모바일 주 메뉴"] a[href="/newcomer/guide"]').click();
  await page.waitForURL('**/newcomer/guide');
  assert.equal(await page.locator('header details').getAttribute('open'), null, 'menu closes after navigation');
  assert.equal(await page.locator('nav[aria-label="모바일 주 메뉴"] a[href="/newcomer/guide"]').getAttribute('aria-current'), 'page');
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log(`PASS: ${routes.length} routes at 1440/390/320px; hero image, keyboard skip, mobile menu, active navigation.`);
} finally { await browser.close(); }
