import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemberClient } from './member';
import { ApiError } from './worship';
import { memberRecordInputSchema } from '@daegwang/contracts/features/member/records';
import { createMemberExtrasClient } from './member-extras';
test('private client requires identity and TLS, sends bearer only and distinguishes conflict', async () => {
  let calls = 0;
  const fetcher = (async (_input, init) => { calls++; assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer verified-token'); assert.equal(init?.credentials, 'omit'); assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store'); return Response.json({}, { status: 409 }); }) as typeof fetch;
  await assert.rejects(createMemberClient('https://api.example.com', async () => null, fetcher).list(), (e: unknown) => e instanceof ApiError && e.status === 401);
  await assert.rejects(createMemberClient('http://api.example.com', async () => 'verified-token', fetcher).list(), (e: unknown) => e instanceof ApiError && e.status === 0);
  assert.equal(calls, 0);
  await assert.rejects(createMemberClient('https://api.example.com', async () => 'verified-token', fetcher).update('r1', 1, { kind: 'PRAYER', title: '', body: '기도', date: '2026-10-04', reflectionId: null }), (e: unknown) => e instanceof ApiError && e.status === 409);
  assert.equal(calls, 1);
});
test('private client rejects malformed records and never retries a failed write automatically', async () => {
  const client = createMemberClient('https://api.example.com', async () => 'token', (async () => Response.json({ data: [{ id: 'r1' }], nextPage: null })) as typeof fetch);
  await assert.rejects(client.list(), (e: unknown) => e instanceof ApiError && e.status === 0);
  let writes = 0;
  const failed = createMemberClient('https://api.example.com', async () => 'token', (async () => { writes++; throw new Error('network'); }) as typeof fetch);
  await assert.rejects(failed.create({ kind: 'PRAYER', title: '', body: '기도', date: '2026-10-04', reflectionId: null })); assert.equal(writes, 1);
});

test('account deletion requires a valid acceptance response and gives specific errors without retrying', async () => {
  let status = 202; let body: unknown = { data: { status: 'accepted' } }; let calls = 0;
  const client = createMemberExtrasClient('https://api.example.com', async () => 'fixture', (async (_url, init) => {
    calls++; assert.equal(init?.method, 'DELETE');
    assert.deepEqual(JSON.parse(String(init?.body)), { password: 'fixture', policyVersion: 'deletion-v2', confirm: 'DELETE' });
    return Response.json(body, { status });
  }) as typeof fetch);
  await client.deleteAccount('fixture', 'deletion-v2');
  body = {}; await assert.rejects(client.deleteAccount('fixture', 'deletion-v2'), (e: unknown) => e instanceof ApiError && e.status === 0);
  status = 403; await assert.rejects(client.deleteAccount('fixture', 'deletion-v2'), (e: unknown) => e instanceof ApiError && e.message.includes('관리자 계정'));
  assert.equal(calls, 3);
});
test('personal prayer needs content but no title or response; special prayer accepts title only', () => {
  assert.equal(memberRecordInputSchema.safeParse({ kind: 'PRAYER', body: '내용', date: '2026-10-04' }).success, true);
  assert.equal(memberRecordInputSchema.safeParse({ kind: 'PRAYER', body: '', date: '2026-10-04' }).success, false);
  assert.equal(memberRecordInputSchema.safeParse({ kind: 'PRAYER', body: '내용', date: '2026-10-04', answeredOn: '2026-10-04' }).success, false);
  assert.equal(memberRecordInputSchema.safeParse({ kind: 'SPECIAL_PRAYER', title: '특별기도' }).success, true);
  assert.equal(memberRecordInputSchema.safeParse({ kind: 'SPECIAL_PRAYER', title: '' }).success, false);
  assert.equal(memberRecordInputSchema.safeParse({ kind: 'SPECIAL_PRAYER', title: '특별기도', date: '2026-10-04', answeredOn: '2026-10-03' }).success, false);
});
