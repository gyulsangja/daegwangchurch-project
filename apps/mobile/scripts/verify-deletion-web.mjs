import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { parse } from 'dotenv';

// Separate browser context, entirely mocked auth/private API. Never submits a real credential.
const env = parse(await readFile('apps/mobile/.env.local'));
const authOrigin = new URL(env.EXPO_PUBLIC_SUPABASE_URL).origin;
const base = 'http://localhost:8081';
const owner = '11111111-1111-4111-8111-111111111111';
const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: 4102444800 })).toString('base64url')}.test`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let failure = true; let deletes = 0;
  const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'authorization,content-type,apikey,x-client-info,x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'Content-Type': 'application/json' };
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    const send = (body, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (url.origin === authOrigin && url.pathname.startsWith('/auth/v1/')) {
      if (request.method() === 'OPTIONS' || url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers });
      assert.ok(url.pathname.endsWith('/token'));
      assert.equal(request.postDataJSON().email, 'deletion-test@example.invalid');
      assert.equal(request.postDataJSON().password, 'fixture-only-password');
      return send({ access_token: token, refresh_token: 'fixture-only-refresh', expires_in: 3600, token_type: 'bearer', user: { id: owner, email: 'deletion-test@example.invalid', aud: 'authenticated', is_anonymous: false, email_confirmed_at: '2026-10-05T00:00:00Z', app_metadata: {}, user_metadata: {}, created_at: '2026-10-05T00:00:00Z' } });
    }
    if (url.pathname.startsWith('/api/v1/')) {
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.pathname === '/api/v1/account/options') return send({ mode: 'configured', registration: false, recovery: false, notifications: false, care: false, deletion: true, deletionPolicyVersion: 'deletion-fixture-v2', policy: { version: 'account-fixture-v1', terms: '', privacy: '', care: '', deletion: '화면 검증용 안내입니다. 실제 계정이나 자료를 삭제하지 않습니다.' } });
      if (url.pathname === '/api/v1/me/profile' && request.method() === 'DELETE') {
        deletes++; assert.equal(request.headers().authorization, `Bearer ${token}`);
        assert.equal(request.postDataJSON().policyVersion, 'deletion-fixture-v2');
        assert.equal(request.postDataJSON().confirm, 'DELETE');
        return failure ? send({ error: { message: 'fixture' } }, 422) : send({ data: { status: 'accepted' } }, 202);
      }
      if (url.pathname === '/api/v1/me/profile') return send({ data: { email: 'deletion-test@example.invalid', displayName: '', consentVersion: null, version: 1 } });
      return send({ data: [], nextPage: null });
    }
    if (url.origin === base) return route.continue();
    // Fonts/analytics/any unexpected remote requests cannot reach external services.
    return route.abort();
  });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/login?returnTo=/account/delete`);
  await page.getByLabel('이메일', { exact: true }).fill('deletion-test@example.invalid');
  await page.getByLabel('비밀번호', { exact: true }).fill('fixture-only-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.getByText('탈퇴 전 확인해 주세요', { exact: true }).waitFor();
  const proceed = page.getByRole('button', { name: '탈퇴 계속하기', exact: true });
  assert.equal(await proceed.isDisabled(), true);
  await page.getByRole('checkbox', { name: '내용을 확인했습니다' }).click();
  await page.getByLabel('현재 비밀번호', { exact: true }).fill('fixture-only-password');
  await proceed.click(); await page.getByText('탈퇴를 요청할까요?', { exact: true }).waitFor();
  await page.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click(); assert.equal(deletes, 0);
  await proceed.click(); await page.getByRole('button', { name: '탈퇴 요청', exact: true }).click();
  await page.getByText('현재 비밀번호를 확인해 주세요.', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('현재 비밀번호', { exact: true }).inputValue(), '');
  failure = false;
  await page.getByLabel('현재 비밀번호', { exact: true }).fill('fixture-only-password');
  await proceed.click(); await page.getByRole('button', { name: '탈퇴 요청', exact: true }).click();
  await page.getByText('탈퇴 요청을 접수했습니다', { exact: true }).waitFor();
  assert.equal(await page.getByText('account/deletion-received', { exact: true }).count(), 0);
  assert.equal(deletes, 2); assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mkdir('test-results/local-servers', { recursive: true });
  await page.screenshot({ path: 'test-results/local-servers/deletion-received-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log('Deletion UI passed: opt-in, cancel, failed password cleanup, correct policy, accepted state, no errors/overflow; all auth and private requests mocked.');
} finally { await browser.close(); }
