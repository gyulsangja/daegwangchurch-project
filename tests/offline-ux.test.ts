import test from 'node:test';
import assert from 'node:assert/strict';
import { monthBounds, monthDates, eventOnDay } from '../packages/contracts/src/features/calendar';
import { collectPages } from '../packages/api-client/src/pagination';
import { createDraftCache } from '../apps/mobile/src/lib/draft-cache';
import { allowAdminPreview, appReadiness } from '../apps/admin/src/lib/app-readiness';
import { eventInMonthWhere } from '../packages/server/src/features/events/app-query-core';
import { createNotificationServices } from '../packages/server/src/features/member/notification-service';
import { defaultPreferences } from '../packages/contracts/src/features/member/extras';
import type { PrismaClient } from '../packages/database/src/generated/client';
test('calendar handles leap years, December and Korean midnight without shifting date', () => {
  assert.equal(monthDates('2028-02').length, 29); assert.equal(monthDates('2026-02').length, 28);
  assert.equal(monthBounds('2026-12').end.toISOString(), '2026-12-31T15:00:00.000Z');
  assert.throws(() => monthBounds('2026-13'));
  const event = { startsAt: '2026-10-04T15:00:00.000Z', endsAt: '2026-10-05T15:00:00.000Z', isAllDay: false };
  assert.equal(eventOnDay(event, '2026-10-04'), false); assert.equal(eventOnDay(event, '2026-10-05'), true); assert.equal(eventOnDay(event, '2026-10-06'), false);
  assert.equal(eventOnDay({ ...event, isAllDay: true }, '2026-10-06'), true);
  assert.deepEqual(eventInMonthWhere('2026-10').startsAt, { lt: monthBounds('2026-10').end });
});
test('monthly reads include later pages and reject a repeated cursor or aborted read', async () => {
  const signal = new AbortController().signal;
  assert.deepEqual(await collectPages(async page => ({ data: [page], nextPage: page < 2 ? page + 1 : null }), signal), [0, 1, 2]);
  await assert.rejects(collectPages(async () => ({ data: [], nextPage: 0 }), signal));
  const controller = new AbortController(); controller.abort(); let reads = 0;
  await assert.rejects(collectPages(async () => { reads++; return { data: [], nextPage: null }; }, controller.signal)); assert.equal(reads, 0);
});
test('drafts recover for the same owner only, expire, and cannot be resurrected after logout', () => {
  let time = 0; const cache = createDraftCache(() => time); const value = { body: 'private draft', version: 2 };
  cache.activate('a'); cache.write('a', 'record', value); value.body = 'changed externally';
  assert.equal(cache.read<typeof value>('a', 'record')?.body, 'private draft'); assert.equal(cache.read('b', 'record'), null);
  cache.activate('a'); assert.ok(cache.read('a', 'record'));
  time = 30 * 60000; assert.equal(cache.read('a', 'record'), null);
  cache.write('a', 'record', value); cache.activate('b'); cache.activate('a'); assert.equal(cache.read('a', 'record'), null);
  cache.write('a', 'record', value); cache.clear(); cache.write('a', 'record', value); cache.activate('a'); assert.equal(cache.read('a', 'record'), null);
  cache.write('a', 'record', value); cache.remove('a', 'record'); assert.equal(cache.read('a', 'record'), null);
});
test('admin preview is closed in production and off-host and exposes no configuration values', () => {
  assert.equal(allowAdminPreview('development', 'true', 'localhost:3001'), true);
  assert.equal(allowAdminPreview('production', 'true', 'localhost:3001'), false);
  assert.equal(allowAdminPreview('development', undefined, 'localhost:3001'), false);
  assert.equal(allowAdminPreview('development', 'true', 'external.example:3001'), false);
  const rows = appReadiness({ DATABASE_URL: 'secret', APP_PUBLICATION_ENABLED: 'true' });
  assert.equal(rows[0].enabled, true); assert.equal(rows[1].enabled, false); assert.ok(!JSON.stringify(rows).includes('secret'));
});
test('notification storage scopes every operation to the member and preserves versions and read time', async () => {
  const owner = '11111111-1111-4111-8111-111111111111'; const other = '22222222-2222-4222-8222-222222222222';
  const row = { id: 'note1', ownerId: owner, category: 'NEWS', title: 'Notice', body: 'Public notification', target: null, createdAt: new Date(), readAt: null as Date | null };
  const { version: initialVersion, ...initialContent } = defaultPreferences;
  const pref = { content: initialContent, version: initialVersion, activationTimes: {}, updatedAt: new Date() };
  const db = {
    memberNotification: {
      findMany: async ({ where }: { where: { ownerId: string } }) => { assert.equal(where.ownerId, owner); return [row]; },
      findFirst: async ({ where }: { where: { ownerId: string; id: string } }) => where.ownerId === owner && where.id === row.id ? row : null,
      updateMany: async ({ where, data }: { where: { ownerId: string; id: string; readAt: null }; data: { readAt: Date } }) => { assert.equal(where.ownerId, owner); assert.equal(where.id, row.id); assert.equal(where.readAt, null); if (!row.readAt) row.readAt = data.readAt; return { count: 1 }; },
    },
    memberNotificationPreference: {
      findUnique: async ({ where }: { where: { ownerId: string } }) => where.ownerId === owner ? pref : null,
      upsert: async ({ where, create }: { where: { ownerId: string }; create: { content: unknown } }) => { assert.equal(where.ownerId, owner); assert.deepEqual(create.content, initialContent); return pref; },
      updateMany: async ({ where, data }: { where: { ownerId: string; version: number }; data: { content: typeof initialContent } }) => { assert.equal(where.ownerId, owner); if (where.version !== pref.version) return { count: 0 }; pref.content = data.content; pref.version++; return { count: 1 }; },
    },
  } as unknown as Pick<PrismaClient, 'memberNotification' | 'memberNotificationPreference'>;
  const service = createNotificationServices(db, owner); const foreign = createNotificationServices(db, other);
  assert.equal((await service.notification.list({})).data.length, 1);
  await assert.rejects(foreign.notification.detail(row.id)); await assert.rejects(foreign.notification.update(row.id, { read: true }));
  await service.notification.update(row.id, { read: true }); const first = row.readAt; await service.notification.update(row.id, { read: true }); assert.equal(row.readAt, first);
  assert.equal((await service.preferences.detail()).notices, false);
  assert.equal((await service.preferences.update('preferences', { version: 1, content: { ...initialContent, notices: true } })).version, 2);
  await assert.rejects(service.preferences.update('preferences', { version: 1, content: initialContent }));
  await assert.rejects(service.notification.update(row.id, { read: true, ownerId: other }));
  await assert.rejects(service.notification.create());
});
