import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const [path, label] of [['bulletins', '주보 조회 연월 선택'], ['devotional', '묵상 조회 연월 선택']]) {
    await page.goto(`http://localhost:8081/${path}`);
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('button', { name: '2026년 8월 선택', exact: true }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toContainText('2026년 8월');
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('button', { name: '이전 연도', exact: true }).click();
    await page.getByRole('button', { name: '선택 취소', exact: true }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toContainText('2026년 8월');
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.screenshot({ path: `apps/mobile/test-results/local-review/${path}-month-picker.png` });
    await page.getByRole('button', { name: '전체 기간 보기', exact: true }).click();
    await expect(page.getByRole('button', { name: label, exact: true })).toContainText('전체 기간');
  }
  await page.goto('http://localhost:8081/sermons');
  await page.getByRole('button', { name: '필터', exact: true }).click();
  await page.getByRole('button', { name: '시작일 선택', exact: true }).click();
  await page.getByRole('button', { name: '2026-10-01 선택', exact: true }).click();
  await page.getByRole('button', { name: '이 날짜 선택', exact: true }).click();
  await expect(page.getByRole('button', { name: '시작일 선택', exact: true })).toContainText('2026년 10월 1일');
  await page.getByRole('button', { name: '종료일 선택', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'apps/mobile/test-results/local-review/date-picker-320.png' });
  await page.getByRole('button', { name: '선택 취소', exact: true }).click();
  await page.getByRole('button', { name: '결과 보기', exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/news/bulletins');
  await page.locator('a[href^="/news/bulletins/"]').first().click();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole('button', { name: '전체 화면', exact: true }).click();
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox(); expect(Math.round(box.width)).toBe(width); expect(Math.round(box.height)).toBe(900);
    await page.screenshot({ path: `apps/mobile/test-results/local-review/bulletin-fullscreen-${width}.png` });
    if (width === 1440) await page.keyboard.press('Escape'); else await page.getByRole('button', { name: '주보 전체 화면 닫기', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  for (const url of ['http://localhost:3000/location', 'http://localhost:8081/church-info/location']) {
    await page.goto(url);
    await expect(page.frameLocator('iframe[title="대광교회 위치 지도"]').locator('#map canvas')).toBeVisible({ timeout: 30000 });
  }
  expect(errors).toEqual([]);
  console.log('Month/date selection, cancellation, reset, 320px layout, bulletin full-screen and both local maps passed.');
} finally { await browser.close(); }
