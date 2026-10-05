import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, beforeEach, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { createPushDeviceService, revokePushDevice } from '@daegwang/server/features/member/push-device-service';
import { createNotificationServices } from '@daegwang/server/features/member/notification-service';
import { createPushWorker } from '@daegwang/server/features/member/push-worker';
import { createWorshipService } from '@daegwang/server/features/worship/service-core';
import { createDeletionService } from '@daegwang/server/features/member/deletion-service';
import { createScheduleService } from '@daegwang/server/features/member/schedule-service';
import type { PushMessage, PushProvider, PushResult } from '@daegwang/server/features/member/push-provider';

const url = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/daegwang_worship_test') throw new Error('Isolated local test database required');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href, max: 8 }) });
after(() => db.$disconnect());
beforeEach(() => db.memberPushDevice.deleteMany());
const sources = { worship: true, notices: true, events: true, schedules: true };
let counter = 10;
async function setup(startHour = '09:00') {
  const day = `2090-02-${counter++}`; let time = new Date(`${day}T${startHour}:00+09:00`);
  const owner = randomUUID(); const projectId = randomUUID(); const clock = () => time;
  const value = { installationId: randomUUID(), secret: randomUUID() + randomUUID(), token: `ExpoPushToken[${randomUUID()}]`, platform: 'android' as const, projectId };
  const device = createPushDeviceService(db, owner, { available: () => true, projectId }, clock);
  await device.create(value);
  const preferences = createNotificationServices(db, owner, clock).preferences;
  const initial = await preferences.detail(); const { version, ...content } = initial;
  await preferences.update('', { version, content: { ...content, notices: true, devotional: true, schedules: true, events: true, worship: true } });
  const sent: PushMessage[] = []; let next: PushResult = { status: 'accepted', receiptId: 'fixture-ticket' }; let receipt: PushResult = { status: 'delivered', code: 'ProviderDelivered' };
  const provider: PushProvider = { send: async message => { sent.push(message); return next; }, receipt: async () => receipt };
  const worker = createPushWorker(db, provider, sources, clock);
  return { day, owner, value, device, clock, preferences, worker, sent, time: (date: Date) => { time = date; }, next: (result: PushResult) => { next = result; }, receipt: (result: PushResult) => { receipt = result; } };
}
async function notice(time: Date, extra = {}) {
  return db.notice.create({ data: { title: 'Fixture private title never sent', slug: randomUUID(), category: '공지', content: {}, status: 'PUBLISHED', isImportant: true, publishedAt: time, ...extra } });
}
test('device registration is owner-bound, secret-protected, limited and revocable without an auth session', async () => {
  const s = await setup();
  const other = createPushDeviceService(db, randomUUID(), { available: () => true, projectId: s.value.projectId }, s.clock);
  assert.equal((await other.list({})).devices.length, 0);
  await assert.rejects(other.create(s.value));
  await assert.rejects(s.device.create({ ...s.value, secret: randomUUID() + randomUUID() }));
  await assert.rejects(s.device.create({ ...s.value, projectId: randomUUID() }));
  for (let i = 0; i < 4; i++) await s.device.create({ ...s.value, installationId: randomUUID(), token: `ExpoPushToken[${randomUUID()}]` });
  await assert.rejects(s.device.create({ ...s.value, installationId: randomUUID(), token: `ExpoPushToken[${randomUUID()}]` }));
  await revokePushDevice(db, { installationId: s.value.installationId, secret: randomUUID() + randomUUID() });
  assert.equal((await s.device.list({})).devices.length, 5);
  await revokePushDevice(db, { installationId: s.value.installationId, secret: s.value.secret });
  assert.equal((await s.device.list({})).devices.length, 4);
});
test('background workers deliver only fresh important notices without opening the app, deduplicate and poll receipts', async () => {
  const s = await setup(); await notice(new Date(s.clock().getTime() - 1000));
  await notice(s.clock(), { isImportant: false }); await notice(s.clock(), { status: 'PRIVATE' });
  const fresh = await notice(s.clock());
  await Promise.all([s.worker(), s.worker()]);
  assert.equal(s.sent.length, 1);
  assert.equal(await db.memberNotification.count({ where: { ownerId: s.owner } }), 1);
  const row = await db.memberPushDelivery.findFirstOrThrow({ where: { ownerId: s.owner }, include: { notification: true } });
  assert.equal(row.status, 'ACCEPTED'); assert.deepEqual(row.notification.target, { kind: 'notices', id: fresh.id });
  assert.equal(JSON.stringify(s.sent).includes('Fixture private title'), false);
  s.time(new Date(s.clock().getTime() + 900001)); await s.worker();
  assert.equal((await db.memberPushDelivery.findUniqueOrThrow({ where: { id: row.id } })).status, 'DELIVERED'); assert.equal(s.sent.length, 1);
});
test('quiet hours defer delivery; an opt-out, hidden content or a read notification cancels queued sends', async () => {
  const s = await setup('23:00'); const hidden = await notice(s.clock()); await s.worker(); assert.equal(s.sent.length, 0);
  await db.notice.update({ where: { id: hidden.id }, data: { status: 'PRIVATE' } });
  s.time(new Date(s.clock().getTime() + 9 * 3600000)); await s.worker(); assert.equal(s.sent.length, 0);
  assert.equal((await db.memberPushDelivery.findFirstOrThrow({ where: { ownerId: s.owner } })).status, 'CANCELLED');
  await notice(s.clock()); s.next({ status: 'retry', code: 'RateLimited' }); await s.worker(); assert.equal(s.sent.length, 1);
  const { version, ...content } = await s.preferences.detail(); await s.preferences.update('', { version, content: { ...content, notices: false } });
  s.time(new Date(s.clock().getTime() + 300000)); await s.worker(); assert.equal(s.sent.length, 1);
});
test('uncertain sends and interrupted leases never automatically resend; dead tokens revoke all queued work', async () => {
  const s = await setup(); s.next({ status: 'unknown', code: 'NetworkUncertain' }); await notice(s.clock()); await s.worker(); await s.worker();
  assert.equal(s.sent.length, 1); assert.equal((await db.memberPushDelivery.findFirstOrThrow({ where: { ownerId: s.owner } })).status, 'UNKNOWN');
  s.time(new Date(s.clock().getTime() + 1000)); await notice(s.clock()); s.next({ status: 'accepted', receiptId: 'ticket' }); await s.worker();
  s.receipt({ status: 'unregistered', code: 'DeviceNotRegistered' }); s.time(new Date(s.clock().getTime() + 900001)); await s.worker();
  assert.equal(await db.memberPushDevice.count({ where: { ownerId: s.owner } }), 0); assert.equal(await db.memberPushDelivery.count({ where: { ownerId: s.owner } }), 0);
});
test('first-hour pushes respect the selected Korea time and send at most once per day, even with two publications', async () => {
  const s = await setup('05:00');
  const admin = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.invalid`, displayName: 'Fixture', role: 'ADMIN' } });
  const worship = createWorshipService(db, s.clock);
  for (let i = 0; i < 2; i++) await worship.create({ adminId: admin.id }, { contentDate: s.day, type: 'FIRST_HOUR', title: `Fixture ${i}`, youtubeUrl: `https://youtu.be/abcdefghij${i}`, status: 'PUBLISHED', isPinned: false, preacher: '', sermonTitle: '', scripture: '', description: '', summary: '' });
  s.time(new Date(`${s.day}T06:29:00+09:00`)); await s.worker(); assert.equal(s.sent.length, 0);
  s.time(new Date(`${s.day}T06:30:00+09:00`)); await s.worker(); await s.worker(); assert.equal(s.sent.length, 1);
  assert.equal(await db.memberPushDelivery.count({ where: { ownerId: s.owner } }), 1);
});
test('timed schedules send 30 minutes before start; all-day schedules send at 08:00; changed schedules are rechecked', async () => {
  const s = await setup('05:00'); const service = createScheduleService(db, s.owner, async () => null, s.clock);
  const common = { kind: 'PERSONAL' as const, title: 'Private appointment', note: 'Never send this', location: 'Private address', startDate: s.day, endDate: s.day };
  await service.create({ ...common, allDay: true, startTime: null, endTime: null });
  await service.create({ ...common, allDay: false, startTime: '10:00', endTime: '11:00' });
  const moved = await service.create({ ...common, allDay: false, startTime: '09:00', endTime: '10:00' });
  await s.worker(); assert.equal(s.sent.length, 0);
  s.time(new Date(`${s.day}T08:00:00+09:00`)); await s.worker(); assert.equal(s.sent.length, 1);
  await service.update(moved.id, { version: 1, content: { ...common, allDay: false, startTime: '14:00', endTime: '15:00' } });
  s.time(new Date(`${s.day}T09:29:00+09:00`)); await s.worker(); assert.equal(s.sent.length, 1);
  s.time(new Date(`${s.day}T09:30:00+09:00`)); await s.worker(); assert.equal(s.sent.length, 2);
  assert.equal(JSON.stringify(s.sent).includes('Private'), false);
  await service.remove(moved.id, { version: 2 }); s.time(new Date(`${s.day}T13:30:00+09:00`)); await s.worker(); assert.equal(s.sent.length, 2);
});
test('daily general-news limit bounds bursts and revocation removes pending delivery capabilities', async () => {
  const s = await setup(); for (let i = 0; i < 7; i++) await notice(s.clock());
  await s.worker(); assert.equal(s.sent.length, 5);
  assert.equal(await db.memberPushDelivery.count({ where: { ownerId: s.owner, resultCode: 'DailyLimit' } }), 2);
  await revokePushDevice(db, { installationId: s.value.installationId, secret: s.value.secret });
  await s.worker(); assert.equal(s.sent.length, 5);
  assert.equal(await db.memberPushDelivery.count({ where: { ownerId: s.owner } }), 0);
});
test('push tables are private, cross-owner linkage is rejected, and member deletion removes devices and deliveries atomically', async () => {
  const s = await setup(); await notice(s.clock()); await s.worker();
  const otherNotification = await db.memberNotification.create({ data: { ownerId: randomUUID(), title: 'Other', body: '', category: 'NEWS', dedupeKey: randomUUID() } });
  await assert.rejects(db.memberPushDelivery.create({ data: { ownerId: s.owner, deviceId: s.value.installationId, notificationId: otherNotification.id, slotKey: randomUUID() } }));
  for (const table of ['member_push_devices', 'member_push_deliveries']) {
    const rows = await db.$queryRawUnsafe<Array<{ relrowsecurity: boolean; readable: boolean }>>(`SELECT relrowsecurity, (has_table_privilege('anon',oid,'SELECT') OR has_table_privilege('authenticated',oid,'SELECT')) AS readable FROM pg_class WHERE oid=$1::regclass`, `public.${table}`);
    assert.equal(rows[0].relrowsecurity, true); assert.equal(rows[0].readable, false);
  }
  await createDeletionService(db, { reauthenticate: async () => {}, deleteIdentity: async () => {}, identityAbsent: async () => true }, s.clock).request({ id: s.owner, email: 'fixture@example.invalid' }, { password: 'fixture', policyVersion: 'fixture', confirm: 'DELETE' }, { version: 'fixture', notice: 'Fixture', scope: 'ALL_MEMBER_DATA', receiptRetentionDays: 1 });
  assert.equal(await db.memberPushDevice.count({ where: { ownerId: s.owner } }), 0); assert.equal(await db.memberPushDelivery.count({ where: { ownerId: s.owner } }), 0);
  await assert.rejects(s.device.create(s.value));
});

test('read state, ended events, expired installations and interrupted claims suppress delayed pushes', async () => {
  const s = await setup('23:00');
  await notice(s.clock());
  await db.event.create({ data: { title: 'Ends overnight', slug: randomUUID(), category: '행사', status: 'PUBLISHED', publishedAt: s.clock(), startsAt: new Date(s.clock().getTime() + 60000), endsAt: new Date(s.clock().getTime() + 3600000) } });
  await s.worker(); assert.equal(s.sent.length, 0);
  const rows = await db.memberPushDelivery.findMany({ where: { ownerId: s.owner }, include: { notification: true } });
  assert.equal(rows.length, 2);
  const news = rows.find(row => (row.notification.target as { kind: string }).kind === 'notices')!;
  await db.memberNotification.update({ where: { id: news.notificationId }, data: { readAt: s.clock() } });
  s.time(new Date(s.clock().getTime() + 9 * 3600000)); await s.worker(); assert.equal(s.sent.length, 0);
  await notice(s.clock()); s.next({ status: 'retry', code: 'RateLimited' }); await s.worker();
  const queued = await db.memberPushDelivery.findFirstOrThrow({ where: { ownerId: s.owner, status: 'PENDING' } });
  await db.memberPushDelivery.update({ where: { id: queued.id }, data: { status: 'SENDING', nextAttemptAt: s.clock() } });
  await s.worker(); assert.equal((await db.memberPushDelivery.findUniqueOrThrow({ where: { id: queued.id } })).status, 'UNKNOWN'); assert.equal(s.sent.length, 1);
  await db.memberPushDevice.update({ where: { id: s.value.installationId }, data: { expiresAt: s.clock() } });
  await s.worker(); assert.equal(await db.memberPushDevice.count({ where: { ownerId: s.owner } }), 0); assert.equal(s.sent.length, 1);
});

test('a delayed invalid-token receipt cannot revoke a newly rotated token on the same installation', async () => {
  const s = await setup(); await notice(s.clock()); await s.worker(); assert.equal(s.sent.length, 1);
  s.time(new Date(s.clock().getTime() + 1000)); const rotated = { ...s.value, token: `ExpoPushToken[${randomUUID()}]` };
  await s.device.create(rotated);
  s.receipt({ status: 'unregistered', code: 'DeviceNotRegistered' });
  s.time(new Date(s.clock().getTime() + 900001)); await s.worker();
  assert.equal((await db.memberPushDevice.findUniqueOrThrow({ where: { id: s.value.installationId } })).token, rotated.token);
  await notice(s.clock()); await s.worker(); assert.equal(s.sent.length, 2); assert.equal(s.sent[1].to, rotated.token);
});
