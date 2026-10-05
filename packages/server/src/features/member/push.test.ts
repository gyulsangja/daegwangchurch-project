import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createExpoPushProvider } from './push-provider';
import { createPushRevokeHandler, createPushWorkerHandler } from './push-api';
import { pushConfig } from './push-config';
import { afterQuietHours } from './push-policy';

test('Expo adapter sends a generic OS-visible payload without private text and distinguishes a ticket from a receipt', async () => {
  const calls: { url: string; input: unknown }[] = [];
  const provider = createExpoPushProvider('fixture-secret', (async (url, init) => {
    calls.push({ url: String(url), input: JSON.parse(String(init?.body)) });
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer fixture-secret');
    return Response.json(String(url).endsWith('send') ? { data: { status: 'ok', id: 'ticket-1' } } : { data: { 'ticket-1': { status: 'ok' } } });
  }) as typeof fetch);
  assert.deepEqual(await provider.send({ to: 'ExpoPushToken[fixture_token]', notificationId: 'notice-1', ttl: 300 }), { status: 'accepted', receiptId: 'ticket-1' });
  assert.deepEqual(calls[0].input, { to: 'ExpoPushToken[fixture_token]', title: '대광교회', body: '새 알림이 있습니다. 앱에서 확인해 주세요.', data: { notificationId: 'notice-1' }, sound: 'default', channelId: 'church-updates', ttl: 300, priority: 'normal' });
  assert.equal((await provider.receipt('ticket-1')).status, 'delivered');
});
test('provider handles invalid tokens, explicit rate rejection, ambiguous network outcomes and missing receipts safely', async () => {
  const msg = { to: 'ExpoPushToken[fixture_token]', notificationId: 'notice-1', ttl: 300 };
  const response = (data: unknown, status = 200) => (async () => Response.json(data, { status })) as typeof fetch;
  assert.equal((await createExpoPushProvider(undefined, response({ data: { status: 'error', details: { error: 'DeviceNotRegistered' } } })).send(msg)).status, 'unregistered');
  assert.equal((await createExpoPushProvider(undefined, response({}, 429)).send(msg)).status, 'retry');
  assert.equal((await createExpoPushProvider(undefined, response({}, 503)).send(msg)).status, 'unknown');
  assert.equal((await createExpoPushProvider(undefined, (async () => { throw new Error('secret must not be exposed'); }) as typeof fetch).send(msg)).status, 'unknown');
  assert.equal((await createExpoPushProvider(undefined, response({ data: {} })).receipt('missing')).status, 'pending');
});
test('cron endpoint requires a configured secret, POST and enabled services before any work', async () => {
  let calls = 0; let enabled = true; const secret = 'fixture-'.repeat(8);
  const handler = createPushWorkerHandler(() => ({ available: enabled, workerSecret: secret }), async () => { calls++; return { accepted: 0 }; });
  const request = (token: string, method = 'POST') => new Request('https://api.example/api/internal/push', { method, headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await handler(request('wrong'))).status, 401);
  assert.equal((await handler(request(secret, 'GET'))).status, 405);
  enabled = false; assert.equal((await handler(request(secret))).status, 503); assert.equal(calls, 0);
  enabled = true; assert.equal((await handler(request(secret))).status, 200); assert.equal(calls, 1);
  const env = { APP_MEMBER_NOTIFICATIONS_ENABLED: 'true', APP_PUSH_ENABLED: 'true', APP_PUSH_WORKER_READY: 'true', EXPO_PUSH_PROJECT_ID: randomUUID(), APP_PUSH_WORKER_SECRET: secret };
  assert.equal(pushConfig(env).available, true);
  assert.equal(pushConfig({ ...env, APP_PUSH_WORKER_READY: 'false' }).available, false);
  assert.equal(pushConfig({ ...env, EXPO_PUSH_PROJECT_ID: '' }).available, false);
});
test('device unsubscribe accepts only bounded capabilities, with exact allowed origins and no arbitrary operations', async () => {
  let calls = 0;
  const handler = createPushRevokeHandler(async () => { calls++; }, () => ['https://app.example']);
  const body = { installationId: randomUUID(), secret: randomUUID() + randomUUID() };
  const request = (input: unknown, origin = 'https://app.example') => new Request('https://api.example/api/v1/push/revoke', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  assert.equal((await handler(request(body, 'https://outside.example'))).status, 403);
  assert.equal((await handler(request({ ...body, ownerId: randomUUID() }))).status, 422);
  assert.equal((await handler(request({ ...body, secret: 'x'.repeat(1100) }))).status, 413);
  assert.equal(calls, 0);
  assert.equal((await handler(request(body))).status, 204); assert.equal(calls, 1);
});
test('quiet hours use Korea time, deferring late evening to the following morning', () => {
  for (const [input, expected] of [['2026-10-06T23:00:00+09:00', '2026-10-07T08:00:00+09:00'], ['2026-10-06T07:59:59+09:00', '2026-10-06T08:00:00+09:00'], ['2026-10-06T08:00:00+09:00', '2026-10-06T08:00:00+09:00']]) assert.equal(afterQuietHours(new Date(input)).toISOString(), new Date(expected).toISOString());
});
