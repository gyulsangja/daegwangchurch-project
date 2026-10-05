import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { createAutomaticNotificationService, type NotificationSources } from '@daegwang/server/features/member/notification-sync';
import { createNotificationServices } from '@daegwang/server/features/member/notification-service';
import { createWorshipService } from '@daegwang/server/features/worship/service-core';
import { createScheduleService } from '@daegwang/server/features/member/schedule-service';

const url = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/daegwang_worship_test') throw new Error('Isolated local test database required');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });
after(() => db.$disconnect());
const flags: NotificationSources = { worship: true, notices: true, events: true, schedules: true };
let fixtureDay = 10;
async function setup() {
  const date = `2070-01-${fixtureDay++}`; let time = new Date(`${date}T05:00:00+09:00`);
  const owner = randomUUID(); const clock = () => time;
  const settings = createNotificationServices(db, owner, clock).preferences;
  const preferences = await settings.detail();
  const inbox = createAutomaticNotificationService(db, owner, flags, clock);
  return { date, owner, clock, settings, preferences, inbox, setTime: (next: Date) => { time = next; } };
}
async function notice(time: Date, extra = {}) {
  return db.notice.create({ data: { title: `Notice ${randomUUID()}`, slug: randomUUID(), category: '공지', content: { body: 'Not copied to notifications' }, status: 'PUBLISHED', publishedAt: time, ...extra } });
}

test('automatic inbox is opt-in, skips old content, respects per-channel start and concurrent deduplication', async () => {
  const s = await setup(); const old = await notice(new Date(s.clock().getTime() - 1000));
  assert.equal((await s.inbox.list({})).data.length, 0);
  const { version, ...content } = s.preferences;
  await s.settings.update('', { version, content: { ...content, notices: true } });
  s.setTime(new Date(s.clock().getTime() + 1000)); const fresh = await notice(s.clock());
  const hidden = await notice(s.clock(), { status: 'PRIVATE' });
  const future = await notice(s.clock(), { publishStartsAt: new Date(s.clock().getTime() + 3600000) });
  await Promise.all([s.inbox.list({}), s.inbox.list({})]);
  const rows = (await s.inbox.list({})).data;
  assert.deepEqual(rows.map(row => row.target?.id), [fresh.id]);
  assert.ok(!rows.some(row => [old.id, hidden.id, future.id].includes(row.target?.id ?? '')));
  const read = await s.inbox.update(rows[0].id, { read: true });
  await db.notice.update({ where: { id: fresh.id }, data: { title: 'Changed public title' } });
  const after = (await s.inbox.list({})).data;
  assert.equal(after.length, 1); assert.equal(after[0].readAt, read.readAt); assert.equal(after[0].title, 'Changed public title');
  const stored = await db.memberNotification.findFirstOrThrow({ where: { ownerId: s.owner } });
  assert.ok(!JSON.stringify(stored).includes('Changed public title'));
  assert.ok(!JSON.stringify(stored).includes('Not copied'));
});

test('unrelated settings preserve activation; off/on skips content from the disabled interval', async () => {
  const s = await setup(); const { version, ...content } = s.preferences;
  let saved = await s.settings.update('', { version, content: { ...content, notices: true } });
  const started = (await db.memberNotificationPreference.findUniqueOrThrow({ where: { ownerId: s.owner } })).activationTimes;
  s.setTime(new Date(s.clock().getTime() + 1000)); const first = await notice(s.clock());
  s.setTime(new Date(s.clock().getTime() + 1000));
  const { version: secondVersion, ...secondContent } = saved;
  saved = await s.settings.update('', { version: secondVersion, content: { ...secondContent, devotionalTime: '08:00' } });
  assert.deepEqual((await db.memberNotificationPreference.findUniqueOrThrow({ where: { ownerId: s.owner } })).activationTimes, started);
  assert.ok((await s.inbox.list({})).data.some(row => row.target?.id === first.id));
  const { version: thirdVersion, ...thirdContent } = saved;
  saved = await s.settings.update('', { version: thirdVersion, content: { ...thirdContent, notices: false } });
  s.setTime(new Date(s.clock().getTime() + 1000)); const missed = await notice(s.clock());
  s.setTime(new Date(s.clock().getTime() + 1000));
  const { version: fourthVersion, ...fourthContent } = saved;
  await s.settings.update('', { version: fourthVersion, content: { ...fourthContent, notices: true } });
  assert.ok(!(await s.inbox.list({})).data.some(row => row.target?.id === missed.id));
});

test('devotional notifications obey Korean requested time and APP visibility, not just published CMS status', async () => {
  const s = await setup(); const { version, ...content } = s.preferences;
  await s.settings.update('', { version, content: { ...content, devotional: true, worship: true } });
  const admin = await db.adminProfile.create({ data: { authUserId: randomUUID(), email: `${randomUUID()}@example.invalid`, displayName: 'Fixture', role: 'ADMIN' } });
  const worship = createWorshipService(db, s.clock);
  const common = { contentDate: s.date, youtubeUrl: 'https://youtu.be/abcdefghijk', status: 'PUBLISHED', isPinned: false, preacher: '', sermonTitle: '', scripture: '', description: '', summary: '' };
  const word = await worship.create({ adminId: admin.id }, { ...common, type: 'FIRST_HOUR', title: 'Morning fixture' });
  const sermon = await worship.create({ adminId: admin.id }, { ...common, type: 'SUNDAY_MORNING', title: 'Sermon fixture' });
  assert.deepEqual((await s.inbox.list({})).data.map(row => row.target?.id), [sermon.id]);
  s.setTime(new Date(`${s.date}T06:29:59+09:00`)); assert.equal((await s.inbox.list({})).data.length, 1);
  s.setTime(new Date(`${s.date}T06:30:00+09:00`)); assert.equal((await s.inbox.list({})).data.length, 2);
  const notification = (await s.inbox.list({})).data.find(row => row.target?.id === word.id)!;
  await db.worshipPublication.deleteMany({ where: { worshipContentId: word.id } });
  assert.equal((await s.inbox.detail(notification.id)).target, null);
});

test('today schedules remain owner-only, expose no notes, invalidate moved/deleted targets and dedupe per day', async () => {
  const s = await setup(); const { version, ...content } = s.preferences;
  await s.settings.update('', { version, content: { ...content, schedules: true } });
  const schedules = createScheduleService(db, s.owner, async () => null, s.clock);
  const personal = { kind: 'PERSONAL' as const, title: 'Personal fixture', note: 'Never copy my private note', location: 'Never copy my location', startDate: s.date, endDate: s.date, allDay: true, startTime: null, endTime: null };
  const row = await schedules.create(personal);
  await schedules.create({ ...personal, title: 'Already ended today', allDay: false, startTime: '03:00', endTime: '04:00' });
  await createScheduleService(db, randomUUID(), async () => null).create({ ...personal, title: 'Other member' });
  const items = (await s.inbox.list({})).data;
  assert.equal(items.length, 1); assert.equal(items[0].target?.id, row.id);
  assert.ok(!JSON.stringify(items).includes(personal.note)); assert.ok(!JSON.stringify(items).includes(personal.location));
  const nextDate = new Date(new Date(`${s.date}T12:00:00+09:00`).getTime() + 86400000).toISOString().slice(0, 10);
  await schedules.update(row.id, { version: 1, content: { ...personal, startDate: nextDate, endDate: nextDate } });
  assert.equal((await s.inbox.detail(items[0].id)).target, null);
  s.setTime(new Date(`${nextDate}T08:00:00+09:00`)); const later = (await s.inbox.list({})).data;
  assert.equal(later.filter(item => item.target?.id === row.id).length, 1); assert.equal(later.length, 2);
  await schedules.remove(row.id, { version: 2 });
  assert.ok((await s.inbox.list({})).data.every(item => item.target === null));
});

test('event notices and saved events respect publication, source flags, other-owner access and deletion tombstones', async () => {
  const s = await setup(); const { version, ...content } = s.preferences;
  await s.settings.update('', { version, content: { ...content, events: true, schedules: true } });
  const event = await db.event.create({ data: { title: 'Public event', slug: randomUUID(), category: '행사', startsAt: new Date(`${s.date}T10:00:00+09:00`), publishedAt: s.clock(), status: 'PUBLISHED' } });
  await db.memberSchedule.create({ data: { ownerId: s.owner, eventId: event.id } });
  assert.equal((await s.inbox.list({})).data.length, 2);
  const stored = (await s.inbox.list({})).data;
  const other = createAutomaticNotificationService(db, randomUUID(), flags, s.clock);
  await assert.rejects(other.detail(stored[0].id));
  const disabled = createAutomaticNotificationService(db, s.owner, { ...flags, events: false }, s.clock);
  assert.ok((await disabled.list({})).data.every(item => item.target === null));
  await db.event.update({ where: { id: event.id }, data: { status: 'PRIVATE' } });
  assert.ok((await s.inbox.list({})).data.every(item => item.target === null && !item.body.includes('Public event')));
  await db.memberNotification.deleteMany({ where: { ownerId: s.owner } });
  await db.memberDeletion.create({ data: { ownerId: s.owner, policyVersion: 'fixture', policySnapshot: {}, receiptRetentionDays: 1, nextAttemptAt: new Date('2099-01-01') } });
  await s.inbox.synchronize(); assert.equal(await db.memberNotification.count({ where: { ownerId: s.owner } }), 0);
});

test('reserved/expired/deleted notices cannot reveal their previous titles or links', async () => {
  const s = await setup(); const { version, ...content } = s.preferences;
  await s.settings.update('', { version, content: { ...content, notices: true } });
  const n = await notice(s.clock()); const row = (await s.inbox.list({})).data.find(item => item.target?.id === n.id)!;
  for (const change of [{ publishStartsAt: new Date(s.clock().getTime() + 1000) }, { publishStartsAt: null, publishEndsAt: s.clock() }, { publishEndsAt: null, deletedAt: s.clock() }]) {
    await db.notice.update({ where: { id: n.id }, data: change });
    const hidden = await s.inbox.detail(row.id); assert.equal(hidden.target, null); assert.notEqual(hidden.title, n.title);
  }
});
