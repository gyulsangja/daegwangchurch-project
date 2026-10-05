import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDeletionHandler } from './deletion-api';
import { deletionConfig } from './deletion-config';
import { AccountOperationError } from './account-service';
import { createDeletionProvider } from './deletion-provider';

const policy = { version: 'fixture-v1', notice: 'Fixture only', scope: 'ALL_MEMBER_DATA' as const, receiptRetentionDays: 1 };
test('deletion endpoint authenticates, limits body, rejects forged identity and returns accepted rather than completed', async () => {
  let calls = 0;
  const handler = createDeletionHandler({ policy: () => policy, allowedOrigins: () => ['http://localhost:8081'], authenticate: async token => token === 'valid' ? { id: 'server-identity', email: 'test@example.invalid' } : null,
    remove: async (identity, input, selected) => { calls++; assert.equal(identity.id, 'server-identity'); assert.equal(selected.version, policy.version); assert.deepEqual(input, { password: 'fixture', policyVersion: policy.version, confirm: 'DELETE' }); },
  });
  const payload = { password: 'fixture', policyVersion: policy.version, confirm: 'DELETE' };
  const send = (body: unknown, token = 'valid', origin = 'http://localhost:8081') => handler(new Request('http://localhost:3001/api/v1/me/profile', { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  assert.equal((await send(payload, 'expired')).status, 401);
  assert.equal((await send(payload, 'valid', 'https://outside.example')).status, 403);
  assert.equal((await send({ ...payload, ownerId: 'other' })).status, 422);
  assert.equal((await send({ ...payload, password: 'x'.repeat(5000) })).status, 413);
  assert.equal(calls, 0);
  const result = await send(payload); assert.equal(result.status, 202); assert.deepEqual(await result.json(), { data: { status: 'accepted' } });
  assert.equal(result.headers.get('Cache-Control'), 'no-store'); assert.equal(calls, 1);
});

test('deletion endpoint is closed without policy and maps protected, stale, reauthentication and rate failures safely', async () => {
  const payload = { password: 'fixture', policyVersion: policy.version, confirm: 'DELETE' };
  const req = () => new Request('http://localhost:3001/api/v1/me/profile', { method: 'DELETE', headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const deps = { policy: () => policy, allowedOrigins: () => [], authenticate: async () => ({ id: 'server-identity', email: 'test@example.invalid' }), remove: async () => {} };
  assert.equal((await createDeletionHandler({ ...deps, policy: () => null })(req())).status, 503);
  for (const status of [403, 409, 422, 429, 503]) {
    const response = await createDeletionHandler({ ...deps, remove: async () => { throw new AccountOperationError(status); } })(req());
    assert.equal(response.status, status); assert.ok(!(await response.text()).includes('fixture'));
  }
});

test('deletion configuration requires separate reviewed scope, worker acknowledgement and a server secret', () => {
  const env = { APP_ACCOUNT_DELETION_ENABLED: 'true', APP_ACCOUNT_DELETION_WORKER_READY: 'true', APP_ACCOUNT_DELETION_POLICY: JSON.stringify(policy), SUPABASE_SECRET_KEY: 'sb_secret_fixture', NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture' };
  assert.equal(deletionConfig(env)?.policy.scope, 'ALL_MEMBER_DATA');
  assert.equal(deletionConfig({ ...env, SUPABASE_SECRET_KEY: 'sb_publishable_fixture' }), null);
  assert.equal(deletionConfig({ ...env, APP_ACCOUNT_DELETION_WORKER_READY: 'false' }), null);
  assert.equal(deletionConfig({ ...env, APP_ACCOUNT_DELETION_POLICY: JSON.stringify({ ...policy, receiptRetentionDays: 0 }) }), null);
  assert.equal(deletionConfig({ ...env, APP_ACCOUNT_DELETION_POLICY: JSON.stringify({ ...policy, scope: 'KEEP_CARE_RECORDS' }) }), null);
});

test('provider adapter treats only explicit user absence as completed, retaining transient and authorization failures', async () => {
  let code = 'user_not_found'; let status = 404;
  const config = { url: 'https://fixture.supabase.co', publishableKey: 'sb_publishable_fixture', secretKey: 'sb_secret_fixture' };
  const fetcher = (async (_url, init) => {
    assert.equal(new Headers(init?.headers).get('apikey'), config.secretKey);
    if (init?.method === 'DELETE') assert.deepEqual(JSON.parse(String(init.body)), { should_soft_delete: false });
    return Response.json({ code, message: 'fixture' }, { status, headers: { 'X-Supabase-Api-Version': '2024-01-01' } });
  }) as typeof fetch;
  const adapter = createDeletionProvider(config, fetcher);
  const owner = '00000000-0000-4000-8000-000000000001';
  await adapter.deleteIdentity(owner); assert.equal(await adapter.identityAbsent(owner), true);
  code = 'not_admin'; status = 403;
  await assert.rejects(adapter.deleteIdentity(owner)); await assert.rejects(adapter.identityAbsent(owner));
  code = 'unexpected_failure'; status = 500;
  await assert.rejects(adapter.deleteIdentity(owner)); await assert.rejects(adapter.identityAbsent(owner));
});

test('password reauthentication checks the verified owner and always discards its temporary session', async () => {
  const owner = '00000000-0000-4000-8000-000000000001'; let returnedOwner = owner; let logouts = 0;
  const jwt = `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: owner, exp: 4102444800 })).toString('base64url')}.fixture`;
  const fetcher = (async (url, init) => {
    if (String(url).includes('/logout')) { logouts++; return new Response(null, { status: 204 }); }
    assert.ok(String(url).includes('/token?grant_type=password'));
    const value = JSON.parse(String(init?.body)); assert.equal(value.email, 'test@example.invalid'); assert.equal(value.password, 'fixture-password');
    return Response.json({ access_token: jwt, refresh_token: 'fixture-refresh', expires_in: 3600, token_type: 'bearer', user: { id: returnedOwner, email: value.email, email_confirmed_at: '2026-10-05T00:00:00Z', is_anonymous: false } });
  }) as typeof fetch;
  const adapter = createDeletionProvider({ url: 'https://fixture.supabase.co', publishableKey: 'sb_publishable_fixture', secretKey: 'sb_secret_fixture' }, fetcher);
  await adapter.reauthenticate(owner, 'test@example.invalid', 'fixture-password'); assert.equal(logouts, 1);
  returnedOwner = '00000000-0000-4000-8000-000000000002';
  await assert.rejects(adapter.reauthenticate(owner, 'test@example.invalid', 'fixture-password'), (e: unknown) => e instanceof AccountOperationError && e.status === 422);
  assert.equal(logouts, 2);
});
