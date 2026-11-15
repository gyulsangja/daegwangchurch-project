import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewMembers, previewPolicy } from '../scripts/preview-members';

test('synthetic immediate signup → login → recovery → old session rejection → deletion', async () => {
  const handle = createPreviewMembers({ worship: [], events: [] }, () => Date.now(), { immediateSignup: true });
  const email = 'release-review@example.invalid';
  const password = 'Fixture-original-123!'; const nextPassword = 'Fixture-reset-456!';
  const call = async (path: string, body?: unknown, token?: string, method = body ? 'POST' : 'GET') => {
    const response = await handle(new Request(`http://127.0.0.1:3210${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    assert.ok(response); return response;
  };
  const signup = { email, password, confirm: password, displayName: '', ageConfirmed: true, consent: true, policyVersion: previewPolicy.version };
  assert.equal((await call('/api/v1/account/signup', { ...signup, consent: false })).status, 422);
  const registered = await call('/api/v1/account/signup', signup);
  assert.equal(registered.status, 200);
  assert.equal((await registered.json()).verificationRequired, false);
  const login = async (pass: string) => call('/auth/v1/token?grant_type=password', { email, password: pass });
  const first = await login(password); assert.equal(first.status, 200);
  const original = (await first.json()).access_token;
  assert.equal((await call('/api/v1/me/profile', undefined, original)).status, 200);
  assert.equal((await call('/api/v1/account/recovery', { email })).status, 200);
  const reset = { email, password: nextPassword, confirm: nextPassword, code: '000000' };
  assert.equal((await call('/api/v1/account/reset', reset)).status, 422);
  assert.equal((await call('/api/v1/account/reset', { ...reset, code: '123456' })).status, 200);
  assert.equal((await call('/api/v1/me/profile', undefined, original)).status, 401);
  assert.equal((await login(password)).status, 400);
  const current = (await (await login(nextPassword)).json()).access_token;
  const deletion = { password: nextPassword, policyVersion: previewPolicy.version, confirm: 'DELETE' };
  assert.equal((await call('/api/v1/me/profile', { ...deletion, password }, current, 'DELETE')).status, 422);
  assert.equal((await call('/api/v1/me/profile', deletion, current, 'DELETE')).status, 204);
  assert.equal((await call('/api/v1/me/profile', undefined, current)).status, 401);
  assert.equal((await login(nextPassword)).status, 400);
  assert.equal((await call('/auth/v1/token?grant_type=password', { email: 'other@example.invalid', password: 'Demo-only-123!' })).status, 200);
});
