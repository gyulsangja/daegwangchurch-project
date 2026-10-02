import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const output = process.env.MOBILE_SCREENSHOT_DIR || 'test-results';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.text().includes('Unexpected text node')) errors.push(message.text()); });
  const item = { id: 'example-1', version: 1, type: 'FIRST_HOUR', title: '내 안에 거하라', contentDate: '2026-10-02',
    youtube: { videoId: 'T0000000001', url: 'https://www.youtube.com/watch?v=T0000000001', thumbnailUrl: null },
    preacher: null, sermonTitle: null, scriptureReference: '요한복음 15:1–8', description: '말씀을 들으며 마음에 남은 내용을 돌아보세요.', summary: null };
  let mode = 'normal';
  await page.route('**/api/v1/worship**', async (route) => {
    const url = new URL(route.request().url());
    const isDetail = url.pathname.endsWith('/example-1');
    const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
    if (mode === 'error') return route.fulfill({ status: 503, headers, body: '{}' });
    if (mode === 'hidden' && isDetail) return route.fulfill({ status: 404, headers, body: '{}' });
    const data = isDetail ? { data: item } : { data: mode === 'empty' || url.searchParams.get('month') === '2025-01' ? [] : [item], nextCursor: null };
    await route.fulfill({ status: 200, headers, body: JSON.stringify(data) });
  });
  await page.route('https://www.youtube.com/embed/**', (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<meta charset="utf-8"><body style="background:#142e32;color:white;text-align:center;padding-top:65px;font-family:sans-serif">▶ YouTube · 테스트 영상 영역</body>' }));
  await page.goto('http://localhost:8088');
  await page.getByRole('button', { name: '2026-10-02 내 안에 거하라 상세 보기' }).waitFor();
  await page.screenshot({ path: `${output}/mobile-devotional-list.png` });
  await page.getByRole('button', { name: '2026-10-02 내 안에 거하라 상세 보기' }).click();
  await page.getByText('본문 위치', { exact: true }).waitFor();
  await page.frameLocator('iframe').getByText('▶ YouTube · 테스트 영상 영역').waitFor();
  await page.screenshot({ path: `${output}/mobile-devotional-detail.png` });
  assert.ok(await page.getByRole('button', { name: 'YouTube에서 보기 ›' }).isVisible());
  mode = 'hidden'; await page.reload();
  await page.getByText('현재 공개되지 않은 말씀입니다.').waitFor();
  mode = 'normal'; await page.getByRole('button', { name: '목록으로', exact: true }).click();
  await page.getByRole('button', { name: /날짜 선택/ }).click();
  await page.getByLabel('조회 연월').fill('2025-01');
  await page.getByRole('button', { name: '적용', exact: true }).click();
  await page.getByText('등록된 묵상이 없습니다').waitFor();
  mode = 'error'; await page.reload();
  await page.getByText('말씀을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.').waitFor();
  mode = 'normal'; await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.getByRole('button', { name: '2026-10-02 내 안에 거하라 상세 보기' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: list/detail/back, month empty state, unpublished detail, error/retry, 390px screenshots. API/video content is a test fixture.');
} finally { await browser.close(); }
