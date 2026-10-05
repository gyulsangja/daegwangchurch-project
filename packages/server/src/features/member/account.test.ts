import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GoTrueClient } from '@supabase/supabase-js';
import { createAccountService, AccountOperationError } from './account-service';

const policy = { version: 'test-policy', terms: 'Test terms', privacy: 'Test privacy', care: '', deletion: '' };
const user = { id: 'd6972d1b-9428-4a8e-b055-a1cdd520b517', email: 'member@example.invalid', email_confirmed_at: '2026-10-05T00:00:00Z', identities: [{ id: 'identity' }] };
function fixture(options: { error?: { status: number }; sessionOnSignup?: boolean; duplicate?: boolean; wrongOwner?: boolean } = {}) {
  const calls: string[] = []; let remembered = 0; let confirmed = 0;
  const auth = {
    async signUp() { calls.push('signup'); return { error: options.error ?? null, data: { user: options.duplicate ? { ...user, identities: [] } : user, session: options.sessionOnSignup ? {} : null } }; },
    async verifyOtp(input: { type: string }) { calls.push(input.type); return { error: options.error ?? null, data: { user: options.wrongOwner ? { ...user, email: 'someone-else@example.invalid' } : user, session: {} } }; },
    async signOut(input: { scope: string }) { calls.push(`signout:${input.scope}`); return { error: null }; },
    async updateUser() { calls.push('password-update'); return { error: null }; },
    async resend() { calls.push('resend'); return { error: options.error ?? null }; },
    async resetPasswordForEmail() { calls.push('recovery-mail'); return { error: options.error ?? null }; },
  } as unknown as GoTrueClient;
  const service = createAccountService({ auth: () => auth, policy, rememberConsent: async () => { remembered++; }, confirmConsent: async () => { confirmed++; } });
  return { service, calls, counts: () => ({ remembered, confirmed }) };
}
const signup = { email: user.email, password: 'test-password-only', confirm: 'test-password-only', displayName: '', policyVersion: policy.version, consent: true };
test('real account adapter validates consent before provider and never records duplicate signup consent', async () => {
  const f = fixture();
  await assert.rejects(f.service('signup', { ...signup, consent: false }));
  await assert.rejects(f.service('signup', { ...signup, policyVersion: 'old' }), (e: unknown) => e instanceof AccountOperationError && e.status === 409);
  assert.deepEqual(f.calls, []);
  await f.service('signup', signup); assert.equal(f.counts().remembered, 1);
  const duplicate = fixture({ duplicate: true }); await duplicate.service('signup', signup); assert.equal(duplicate.counts().remembered, 0);
});
test('signup OTP checks provider identity and clears verification sessions', async () => {
  const f = fixture(); await f.service('verify', { email: user.email, code: '12345678' });
  assert.equal(f.counts().confirmed, 1); assert.deepEqual(f.calls, ['email', 'signout:local']);
  const wrong = fixture({ wrongOwner: true }); await assert.rejects(wrong.service('verify', { email: user.email, code: '123456' })); assert.equal(wrong.counts().confirmed, 0); assert.ok(wrong.calls.includes('signout:local'));
});
test('password recovery requires recovery OTP before update and revokes refresh sessions', async () => {
  const f = fixture(); await f.service('reset', { email: user.email, code: '123456', password: signup.password, confirm: signup.password });
  assert.deepEqual(f.calls, ['recovery', 'password-update', 'signout:global', 'signout:local']);
  const invalid = fixture({ error: { status: 400 } }); await assert.rejects(invalid.service('reset', { email: user.email, code: '123456', password: signup.password, confirm: signup.password })); assert.ok(!invalid.calls.includes('password-update'));
});
test('recovery responses do not enumerate users and provider limits remain visible', async () => {
  await fixture({ error: { status: 400 } }).service('recovery', { email: user.email });
  await assert.rejects(fixture({ error: { status: 429 } }).service('recovery', { email: user.email }), (e: unknown) => e instanceof AccountOperationError && e.status === 429);
  await assert.rejects(fixture({ sessionOnSignup: true }).service('signup', signup), (e: unknown) => e instanceof AccountOperationError && e.status === 503);
});
