import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { parse } from 'dotenv';

// Isolated browser, mocked auth and API, no real member or outgoing notification.
const env = parse(await readFile('apps/mobile/.env.local'));
const authOrigin = new URL(env.EXPO_PUBLIC_SUPABASE_URL).origin; const base = 'http://localhost:8081';
const owner = '11111111-1111-4111-8111-111111111111';
const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: 4102444800 })).toString('base64url')}.fixture`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'authorization,content-type,apikey,x-client-info,x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };
  let hidden = false; let listReads = 0; let settingsSaved = false;
  const notification = { id: 'fixture-news', category: 'NEWS', title: '검증용 교회 소식', body: '교회에서 전하는 소식을 확인해 주세요.', createdAt: '2026-10-06T01:00:00.000Z', readAt: null, target: { kind: 'notices', id: 'fixture-notice' } };
  let prefs = { devotional: false, worship: false, notices: true, events: false, schedules: false, devotionalTime: '06:30', timeZone: 'Asia/Seoul', version: 1 };
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const send = (body, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (url.origin === authOrigin && url.pathname.startsWith('/auth/v1/')) {
      if (request.method() === 'OPTIONS' || url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers });
      assert.ok(url.pathname.endsWith('/token')); assert.equal(request.postDataJSON().email, 'notifications@example.invalid');
      assert.equal(request.postDataJSON().password, 'fixture-password');
      return send({ access_token: token, refresh_token: 'fixture-refresh', expires_in: 3600, token_type: 'bearer', user: { id: owner, email: 'notifications@example.invalid', is_anonymous: false, aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: notification.createdAt } });
    }
    if (url.pathname.startsWith('/api/v1/')) {
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.pathname.startsWith('/api/v1/me/')) assert.equal(request.headers().authorization, `Bearer ${token}`);
      const item = () => hidden ? { ...notification, title: '현재 확인할 수 없는 알림', body: '연결된 내용이 변경되었거나 더 이상 제공되지 않습니다.', target: null } : notification;
      if (url.pathname === '/api/v1/me/notifications') { listReads++; return send({ data: [item()], nextPage: null }); }
      if (url.pathname === '/api/v1/me/notifications/fixture-news') {
        if (request.method() === 'PATCH') notification.readAt = '2026-10-06T02:00:00.000Z';
        return send({ data: item() });
      }
      if (url.pathname === '/api/v1/me/preferences') {
        if (request.method() === 'PATCH') { const body = request.postDataJSON(); assert.equal(body.version, prefs.version); prefs = { ...body.content, version: prefs.version + 1 }; settingsSaved = true; }
        return send({ data: prefs });
      }
      return send({ data: [], nextPage: null });
    }
    return url.origin === base ? route.continue() : route.abort();
  });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/login?returnTo=/notifications`);
  await page.getByLabel('이메일', { exact: true }).fill('notifications@example.invalid');
  await page.getByLabel('비밀번호', { exact: true }).fill('fixture-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.getByRole('button', { name: notification.title, exact: true }).click();
  await page.getByRole('button', { name: '관련 내용 보기', exact: true }).waitFor();
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await page.getByText('읽음 ·', { exact: false }).waitFor();
  hidden = true;
  await page.getByRole('button', { name: '새 알림 확인', exact: true }).click();
  await page.getByRole('button', { name: '현재 확인할 수 없는 알림', exact: true }).click();
  await page.getByText('연결된 내용이 변경되었거나 더 이상 제공되지 않습니다.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '관련 내용 보기', exact: true }).count(), 0);
  await page.getByRole('button', { name: '뒤로', exact: true }).click();
  await page.getByRole('button', { name: '알림 설정', exact: true }).click();
  await page.getByText('휴대폰에 설치한 앱에서 받아요', { exact: true }).waitFor();
  await page.getByText('내게 필요한 소식만', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '이 휴대폰에서 알림 받기', exact: true }).count(), 0);
  await page.getByRole('switch', { name: '중요 공지', exact: true }).click();
  await page.getByRole('button', { name: '알림 설정 저장', exact: true }).click();
  await page.getByText('알림 설정을 저장했습니다.', { exact: true }).waitFor();
  assert.equal(settingsSaved, true); assert.equal(prefs.notices, false); assert.ok(listReads >= 3); assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mkdir('test-results/local-servers', { recursive: true });
  await page.screenshot({ path: 'test-results/local-servers/notification-settings-mobile.png', fullPage: true });
  await page.getByText('휴대폰에 설치한 앱에서 받아요', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/local-servers/notification-settings-top.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log('Notification UI passed: read state, refresh, hidden target, opt-out save, push distinction, 390/320px; all member/auth requests mocked.');
} finally { await browser.close(); }
