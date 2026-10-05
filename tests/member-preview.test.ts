import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createPreviewMembers, previewPolicy } from '../scripts/preview-members';
import { createAccountClient, createMemberExtrasClient } from '../packages/api-client/src/member-extras';
import { careInputSchema, defaultPreferences, notificationSchema } from '../packages/contracts/src/features/member/extras';

function setup() {
  let clock = Date.now(); const handler = createPreviewMembers({ worship: [], events: [] }, () => clock);
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => (await handler(input instanceof Request ? input : new Request(input, init))) ?? new Response(null, { status: 404 })) as typeof fetch;
  const base = 'http://127.0.0.1:3210';
  const request = (path: string, token?: string, body?: unknown, method = body ? 'POST' : 'GET', origin?: string) => fetcher(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const login = async (email = 'demo@example.invalid', password = 'Demo-only-123!') => (await (await request('/auth/v1/token?grant_type=password', undefined, { email, password })).json()).access_token as string;
  const client = (token: string) => createMemberExtrasClient(base, async () => token, fetcher);
  return { handler, request, login, client, account: createAccountClient(base, fetcher), advance: (ms: number) => { clock += ms; } };
}
const content = { kind: 'COUNSELING' as const, name: '가상 이름', phone: '010-0000-0000', preferredTime: '', message: '', method: 'DISCUSS' as const };

test('group interests never grant membership, stay owner scoped and reject stale or forged settings', async () => {
  const context = setup(); const demo = await context.login(); const other = await context.login('other@example.invalid');
  const publicFeed = await (await context.request('/api/v1/groups')).json(); assert.ok(publicFeed.data.notices.length); assert.ok(publicFeed.data.notices.every((row: { audience: string }) => row.audience === 'PUBLIC')); assert.equal(publicFeed.data.memberships, undefined);
  const initial = await context.client(other).groups();
  assert.deepEqual(initial.memberships, []); assert.ok(initial.notices.every(row => row.audience === 'PUBLIC'));
  const updated = await context.client(other).saveGroups({ interests: ['fellowship-a'], notifications: true, version: initial.version });
  assert.deepEqual(updated.interests, ['fellowship-a']); assert.deepEqual(updated.memberships, []); assert.ok(updated.notices.every(row => row.audience === 'PUBLIC'));
  assert.deepEqual((await context.client(demo).groups()).interests, []);
  assert.ok((await context.client(demo).groups()).notices.some(row => row.audience === 'MEMBERS'));
  assert.equal((await context.request('/api/v1/me/groups', other, { interests: [], notifications: false, version: initial.version }, 'PATCH')).status, 409);
  assert.equal((await context.request('/api/v1/me/groups', other, { interests: [], notifications: false, version: updated.version, memberships: ['fellowship-a'] }, 'PATCH')).status, 422);
  assert.equal((await context.request('/api/v1/me/groups', other, { interests: ['invented-group'], notifications: false, version: updated.version }, 'PATCH')).status, 422);
  assert.equal((await context.request('/api/v1/me/groups')).status, 401);
});
test('preview filters saved words and Korean event days and uses the server reflection snapshot', async () => {
  const word = { id: 'word-a', type: 'SPECIAL', version: 2, title: 'Published title', contentDate: '2026-10-04', scriptureReference: null };
  const handler = createPreviewMembers({ worship: [word], events: [{ id: 'event-a', startsAt: '2026-10-04T15:30:00.000Z', endsAt: null }] });
  let token = '';
  const send = async (path: string, body?: unknown) => (await handler(new Request(`http://127.0.0.1:3210${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })))!;
  token = (await (await send('/auth/v1/token?grant_type=password', { email: 'demo@example.invalid', password: 'Demo-only-123!' })).json()).access_token;
  await send('/api/v1/me/bookmarks', { worshipId: word.id });
  assert.equal((await (await send('/api/v1/me/bookmarks?group=sermon')).json()).data.length, 0);
  assert.equal((await (await send('/api/v1/me/bookmarks?group=other')).json()).data.length, 1);
  await send('/api/v1/me/schedules', { kind: 'CHURCH', eventId: 'event-a' });
  assert.equal((await (await send('/api/v1/me/schedules?date=2026-10-04')).json()).data.length, 0);
  assert.equal((await (await send('/api/v1/me/schedules?date=2026-10-05')).json()).data.length, 1);
  const result = await send('/api/v1/me/records', { kind: 'REFLECTION', title: '', body: 'test', date: '2026-10-04', worship: { id: word.id, version: 1, title: 'Client forged title', contentDate: word.contentDate, scriptureReference: null } });
  const record = (await result.json()).data;
  assert.equal(record.content.worship.title, word.title); assert.equal(record.content.worship.version, 2);
});
test('preview refuses external origins and unsigned/expired sessions', async () => {
  const s = setup(); assert.equal((await s.request('/api/v1/me/requests')).status, 401);
  assert.equal((await s.request('/api/v1/account/options', undefined, undefined, 'GET', 'https://outside.example')).status, 403);
  const token = await s.login(); s.advance(3600001); assert.equal((await s.request('/api/v1/me/requests', token)).status, 401);
});
test('care consent, duplicate submission, ownership and cancellation conflicts are enforced', async () => {
  const s = setup(); const a = s.client(await s.login()); const b = s.client(await s.login('other@example.invalid'));
  const input = { content, consent: true as const, policyVersion: previewPolicy.version, requestKey: randomUUID() };
  const item = await a.careCreate(input); assert.equal((await a.careCreate(input)).id, item.id); assert.equal((await a.careList()).data.length, 1);
  await assert.rejects(a.careCreate({ ...input, content: { ...content, name: '다른 이름' } }));
  await assert.rejects(b.careDetail(item.id)); await assert.rejects(b.careCancel(item.id, item.version));
  await assert.rejects(a.careCreate({ ...input, requestKey: randomUUID(), policyVersion: 'obsolete' }));
  assert.equal((await a.careCancel(item.id, item.version)).status, 'CANCELLED'); await assert.rejects(a.careCancel(item.id, item.version));
});
test('notification read state and preferences are owner scoped and versions prevent stale writes', async () => {
  const s = setup(); const a = s.client(await s.login()); const b = s.client(await s.login('other@example.invalid'));
  assert.equal((await a.notification('welcome')).readAt, null); await a.markRead('welcome'); assert.ok((await a.notification('welcome')).readAt); assert.equal((await b.notification('welcome')).readAt, null);
  assert.equal((await a.notifications(0, 'SCHEDULE')).data.length, 0);
  assert.equal((await a.savePreferences({ ...defaultPreferences, notices: true })).notices, true);
  await assert.rejects(a.savePreferences(defaultPreferences)); assert.equal((await b.preferences()).notices, false);
  await assert.rejects(a.savePreferences({ ...defaultPreferences, devotionalTime: '25:99' }));
});
test('signup stays unverified until a valid one-time code; real addresses are refused', async () => {
  const s = setup(); const input = { email: 'new@example.invalid', password: 'Test-only-123', confirm: 'Test-only-123', displayName: '', consent: true as const, policyVersion: previewPolicy.version };
  await assert.rejects(s.account.signup({ ...input, email: 'real@example.com' }));
  await s.account.signup(input); assert.equal(await s.login(input.email, input.password), undefined);
  await assert.rejects(s.account.verify(input.email, '000000')); await s.account.verify(input.email, '123456');
  await assert.rejects(s.account.verify(input.email, '123456')); assert.ok(await s.login(input.email, input.password));
});
test('recovery uses expiring codes and revokes old sessions after reset', async () => {
  const s = setup(); const token = await s.login(); const email = 'demo@example.invalid';
  await s.account.recover(email); s.advance(600001); await assert.rejects(s.account.reset({ email, code: '123456', password: 'Changed-123', confirm: 'Changed-123' }));
  await s.account.recover(email); await s.account.reset({ email, code: '123456', password: 'Changed-123', confirm: 'Changed-123' });
  assert.equal((await s.request('/api/v1/me/profile', token)).status, 401); assert.equal(await s.login(email), undefined); assert.ok(await s.login(email, 'Changed-123'));
});
test('profile update cannot alter identity; deletion needs password and current policy', async () => {
  const s = setup(); const token = await s.login(); const client = s.client(token);
  const profile = await client.profile(); await client.saveProfile('새 표시 이름', profile.version); await assert.rejects(client.saveProfile('충돌', profile.version));
  assert.equal((await s.request('/api/v1/me/profile', token, { displayName: 'bad', version: 2, email: 'other@example.invalid' }, 'PATCH')).status, 422);
  await assert.rejects(client.deleteAccount('incorrect', previewPolicy.version)); await client.deleteAccount('Demo-only-123!', previewPolicy.version);
  assert.equal((await s.request('/api/v1/me/requests', token)).status, 401); assert.equal(await s.login(), undefined); assert.ok(await s.login('other@example.invalid'));
});
test('notification navigation rejects external URLs; care accepts optional story but rejects forged owner', () => {
  assert.ok(careInputSchema.safeParse(content).success); assert.equal(careInputSchema.safeParse({ ...content, ownerId: randomUUID() }).success, false);
  assert.equal(notificationSchema.safeParse({ id: '1', category: 'NEWS', title: '', body: '', readAt: null, createdAt: new Date().toISOString(), target: { kind: 'notices', id: 'https://evil.example' } }).success, false);
});
