import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { createMemberRecordService, MemberRecordConflict, MemberRecordNotFound } from '@daegwang/server/features/member/record-service';
import { createScheduleService } from '@daegwang/server/features/member/schedule-service';
import { createNotificationServices } from '@daegwang/server/features/member/notification-service';
import { createBookmarkService } from '@daegwang/server/features/member/bookmark-service';
import { createMemberRecordHandler } from '@daegwang/server/features/member/record-api';
import { createGroupService, createGroupAdminService } from '@daegwang/server/features/member/group-service';
import { createCareService, createCareAdminService } from '@daegwang/server/features/member/care-service';

const url = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/daegwang_worship_test') throw new Error('Isolated local test database required');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });
after(async () => db.$disconnect());

test('real PostgreSQL member API isolates two owners and rejects stale edits, forged identity, and expired tokens', async () => {
  const first = randomUUID(); const second = randomUUID();
  const handler = createMemberRecordHandler({ enabled: () => true, allowedOrigins: () => ['http://localhost:8081'], authenticate: async token => token === 'first' ? first : token === 'second' ? second : null, service: owner => createMemberRecordService(db, owner) });
  const send = (token: string, method: string, id?: string, body?: unknown) => handler(new Request('http://localhost:3001/api/v1/me/records', { method, headers: { Authorization: `Bearer ${token}`, Origin: 'http://localhost:8081', 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }), id);
  const content = { kind: 'PRAYER', body: 'Private fixture', date: '2026-10-05' };
  const created = await send('first', 'POST', undefined, content);
  assert.equal(created.status, 201); const row = (await created.json()).data;
  assert.equal((await send('second', 'GET', row.id)).status, 404);
  assert.deepEqual((await (await send('second', 'GET')).json()).data, []);
  assert.equal((await send('second', 'PATCH', row.id, { version: 1, content })).status, 404);
  assert.equal((await send('second', 'DELETE', row.id, { version: 1 })).status, 404);
  assert.equal((await send('expired', 'GET', row.id)).status, 401);
  assert.equal((await send('first', 'POST', undefined, { ...content, ownerId: second })).status, 422);
  assert.equal((await send('first', 'PATCH', row.id, { version: 1, content: { ...content, body: 'Updated' } })).status, 200);
  assert.equal((await send('first', 'PATCH', row.id, { version: 1, content })).status, 409);
  assert.equal((await send('first', 'DELETE', row.id, { version: 1 })).status, 409);
  assert.equal((await send('first', 'DELETE', row.id, { version: 2 })).status, 204);
});

test('real PostgreSQL records preserve original worship snapshot and prevent cross-owner prayer links', async () => {
  const first = randomUUID(); const second = randomUUID();
  const worship = { id: 'local-word', version: 1, title: 'Original', contentDate: '2026-10-05', scriptureReference: null };
  const a = createMemberRecordService(db, first, async () => worship);
  const b = createMemberRecordService(db, second, async () => worship);
  const reflection = await a.create({ kind: 'REFLECTION', body: 'Reflection', date: '2026-10-05', worship: { ...worship, title: 'Forged' } });
  assert.equal(reflection.content.kind === 'REFLECTION' && reflection.content.worship.title, 'Original');
  await assert.rejects(b.create({ kind: 'PRAYER', body: 'Prayer', date: '2026-10-05', reflectionId: reflection.id }), MemberRecordNotFound);
  const prayer = await a.create({ kind: 'PRAYER', body: 'Prayer', date: '2026-10-05', reflectionId: reflection.id });
  assert.equal((await a.list({ reflectionId: reflection.id })).data[0].id, prayer.id);
});

test('real PostgreSQL schedules preserve Korean multi-day bounds and owner/version isolation', async () => {
  const a = createScheduleService(db, randomUUID(), async () => null);
  const b = createScheduleService(db, randomUUID(), async () => null);
  const content = { kind: 'PERSONAL', title: 'Month boundary', startDate: '2026-10-31', endDate: '2026-11-01', allDay: true, startTime: null, endTime: null };
  const row = await a.create(content);
  assert.equal((await a.list({ month: '2026-11' })).data[0].id, row.id);
  assert.equal((await a.list({ date: '2026-11-02' })).data.length, 0);
  await assert.rejects(b.detail(row.id), MemberRecordNotFound);
  await assert.rejects(b.remove(row.id, { version: 1 }), MemberRecordNotFound);
  await a.update(row.id, { version: 1, content: { ...content, title: 'Changed' } });
  await assert.rejects(a.update(row.id, { version: 1, content }), MemberRecordConflict);
});

test('real PostgreSQL notifications and preferences remain private, opt-in, and versioned', async () => {
  const owner = randomUUID(); const other = randomUUID();
  const a = createNotificationServices(db, owner); const b = createNotificationServices(db, other);
  const n = await db.memberNotification.create({ data: { ownerId: owner, category: 'NEWS', title: 'Fixture', body: 'Fixture', dedupeKey: randomUUID() } });
  assert.deepEqual((await b.notification.list({})).data, []);
  await assert.rejects(b.notification.update(n.id, { read: true }), MemberRecordNotFound);
  const read = await a.notification.update(n.id, { read: true });
  assert.ok(read.readAt); assert.equal((await a.notification.update(n.id, { read: true })).readAt, read.readAt);
  const { version, ...content } = await a.preferences.detail();
  assert.equal(content.notices, false);
  await a.preferences.update('', { version, content: { ...content, notices: true } });
  await assert.rejects(a.preferences.update('', { version, content }), MemberRecordConflict);
  assert.equal((await b.preferences.detail()).notices, false);
});

test('real PostgreSQL bookmark upsert is idempotent and private; hidden worship has no leaked snapshot', async () => {
  let available = true;
  const worship = { id: 'word-fixture', version: 1, type: 'FIRST_HOUR' as const, title: 'Fixture', contentDate: '2026-10-05', scriptureReference: null, preacher: null, sermonTitle: null, description: null, summary: null, youtube: { videoId: 'abcdefghijk', url: 'https://youtu.be/abcdefghijk', thumbnailUrl: null } };
  // Obtain the exact public contract from the query layer shape.
  const { appWorshipSchema } = await import('@daegwang/contracts/features/worship/app-contract');
  const publicWord = appWorshipSchema.parse(worship);
  const a = createBookmarkService(db, randomUUID(), async () => available ? publicWord : null);
  const b = createBookmarkService(db, randomUUID(), async () => available ? publicWord : null);
  const first = await a.create({ worshipId: worship.id });
  assert.equal((await a.create({ worshipId: worship.id })).id, first.id);
  await b.remove(first.id, {}); assert.equal((await a.list({})).data.length, 1);
  available = false; assert.equal((await a.detail(first.id)).worship, null);
});

test('private tables deny direct anon and authenticated access with RLS', async () => {
  const rows = await db.$queryRaw<Array<{ relname: string; relrowsecurity: boolean; readable: boolean }>>`SELECT relname, relrowsecurity, (has_table_privilege('anon', oid, 'SELECT') OR has_table_privilege('authenticated', oid, 'SELECT')) AS readable FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN ('member_records','member_bookmarks','member_schedules','member_notifications','member_notification_preferences','worship_revisions','worship_publications')`;
  assert.equal(rows.length, 7);
  for (const row of rows) { assert.equal(row.relrowsecurity, true, row.relname); assert.equal(row.readable, false, row.relname); }
});

test('persisted group interests never grant membership; revocation and manager boundaries apply immediately', async () => {
  const chief = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.invalid`, displayName: 'Chief', role: 'SUPER_ADMIN' } });
  const limited = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.invalid`, displayName: 'Manager', role: 'ADMIN' } });
  const owner = randomUUID(); const other = randomUUID();
  await db.memberProfile.create({ data: { ownerId: owner } });
  const manage = createGroupAdminService(db, chief.id);
  const groupId = `fixture-${randomUUID()}`;
  await manage.saveGroup({ id: groupId, name: 'Fixture group', description: '', isActive: true });
  const notice = { groupId, title: 'Only members', body: 'Private notice', audience: 'MEMBERS', status: 'PUBLISHED' };
  await manage.saveNotice(notice);
  const a = createGroupService(db, owner); const b = createGroupService(db, other);
  await a.update({ interests: [groupId], notifications: false, version: 1 });
  assert.equal((await a.snapshot()).notices.length, 0);
  assert.equal((await createGroupService(db).snapshot()).notices.length, 0);
  await assert.rejects(a.update({ interests: [groupId], notifications: false, version: 1 }), MemberRecordConflict);
  await assert.rejects(a.update({ interests: [], notifications: false, version: 2, memberships: [groupId] }));
  await assert.rejects(createGroupAdminService(db, limited.id).saveNotice(notice), /FORBIDDEN/);
  await manage.setMembership(groupId, owner, true);
  assert.equal((await a.snapshot()).notices.length, 1);
  assert.equal((await b.snapshot()).notices.length, 0);
  await manage.setMembership(groupId, owner, false);
  assert.equal((await a.snapshot()).notices.length, 0);
  await db.groupManager.create({ data: { groupId, adminId: limited.id } });
  await createGroupAdminService(db, limited.id).saveNotice({ ...notice, audience: 'PUBLIC' });
  assert.equal((await createGroupService(db).snapshot()).notices.length, 1);
  await manage.saveGroup({ id: groupId, name: 'Fixture group', description: '', isActive: false, version: 1 });
  await assert.rejects(manage.saveGroup({ id: groupId, name: 'Stale', description: '', isActive: true, version: 1 }), MemberRecordConflict);
  assert.equal((await a.snapshot()).notices.length, 0);
  assert.equal((await a.snapshot()).interests.length, 0);
});

test('persisted care consent, idempotency, cancellation, staff access and expiry are enforced', async () => {
  const staff = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.invalid`, displayName: 'Care staff' } });
  const policy = { version: 'test-only', notice: 'Fixture consent', retentionDays: 1, adminIds: [staff.id] };
  let now = new Date('2026-10-05T00:00:00Z');
  const a = createCareService(db, randomUUID(), policy, () => now);
  const b = createCareService(db, randomUUID(), policy, () => now);
  const input = { content: { kind: 'COUNSELING', name: 'Fixture', phone: '010-0000-0000', preferredTime: '', message: '', method: 'DISCUSS' }, consent: true, policyVersion: policy.version, requestKey: randomUUID() };
  await assert.rejects(a.create({ ...input, consent: false }));
  await assert.rejects(a.create({ ...input, policyVersion: 'old' }), MemberRecordConflict);
  const row = await a.create(input);
  assert.equal((await a.create(input)).id, row.id);
  await assert.rejects(a.create({ ...input, content: { ...input.content, message: 'Changed retry' } }), MemberRecordConflict);
  await assert.rejects(b.detail(row.id), MemberRecordNotFound);
  await assert.rejects(createCareAdminService(db, 'unknown', policy, () => now).list(), /FORBIDDEN/);
  const admin = createCareAdminService(db, staff.id, policy, () => now);
  await assert.rejects(admin.update(row.id, 1, 'COMPLETED'), MemberRecordConflict);
  await admin.update(row.id, 1, 'DISCUSSING');
  await assert.rejects(a.update(row.id, { version: 1, action: 'CANCEL' }), MemberRecordConflict);
  await a.update(row.id, { version: 2, action: 'CANCEL' });
  await assert.rejects(admin.update(row.id, 3, 'SCHEDULED'), MemberRecordConflict);
  now = new Date('2026-10-07T00:00:00Z');
  assert.equal((await a.list({})).data.length, 0);
  assert.equal((await admin.list()).length, 0);
  assert.equal((await admin.purgeExpired()).count, 1);
});

test('new operation tables deny direct Data API access', async () => {
  const rows = await db.$queryRaw<Array<{ relname: string; relrowsecurity: boolean; readable: boolean }>>`SELECT relname, relrowsecurity, (has_table_privilege('anon', oid, 'SELECT') OR has_table_privilege('authenticated', oid, 'SELECT')) AS readable FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN ('member_profiles','member_care_requests','church_groups','group_memberships','group_managers','group_preferences','group_notices')`;
  assert.equal(rows.length, 7);
  for (const row of rows) { assert.equal(row.relrowsecurity, true, row.relname); assert.equal(row.readable, false, row.relname); }
});
