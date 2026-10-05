import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createAppEventQueries, upcomingEventWhere, eventOnDateWhere } from './app-query-core';
import { publishedEventWhere } from './public-policy';
import { createAppEventHandlers } from './app-api';
import { createEventClient } from '@daegwang/api-client/events';

test('event public policy preserves publication condition alongside keyword OR', () => {
  const now = new Date('2026-10-04T15:00:00Z');
  const where = { ...publishedEventWhere(now), OR: [{ title: { contains: 'test' } }] };
  assert.equal(where.status, 'PUBLISHED'); assert.equal(where.deletedAt, null);
  assert.deepEqual(where.AND, [{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }]);
  assert.deepEqual(upcomingEventWhere(now), { OR: [
    { isAllDay: false, endsAt: { gt: now } }, { isAllDay: false, endsAt: null, startsAt: { gte: now } },
    { isAllDay: true, endsAt: { gte: now } }, { isAllDay: true, endsAt: null, startsAt: { gte: now } },
  ] });
  const noon = new Date('2026-10-05T03:00:00Z');
  assert.deepEqual((upcomingEventWhere(noon).OR ?? [])[2], { isAllDay: true, endsAt: { gte: now } });
});
test('calendar day includes overlapping events using Korean midnight bounds', () => {
  const start = new Date('2026-10-03T15:00:00Z'); const end = new Date('2026-10-04T15:00:00Z');
  assert.deepEqual(eventOnDateWhere('2026-10-04'), { startsAt: { lt: end }, OR: [{ endsAt: { gt: start } }, { isAllDay: true, endsAt: { gte: start } }, { endsAt: null, startsAt: { gte: start } }] });
});
test('event list/detail queries scope visibility, separate past and omit internal content', async () => {
  const now = new Date('2026-10-04T00:00:00Z');
  const calls: unknown[] = [];
  const row = { id: 'e1', title: '행사', category: '모임', startsAt: now, endsAt: null, isAllDay: false, location: null, ministryName: null, description: { body: '행사 내용', secret: 'internal' } };
  const database = { event: { findMany: async (args: unknown) => { calls.push(args); return Array(21).fill(row); }, findFirst: async (args: unknown) => { calls.push(args); return row; } } } as unknown as Pick<PrismaClient, 'event'>;
  const queries = createAppEventQueries(database, () => now);
  const page = await queries.list(1, 'past'); assert.equal(page.data.length, 20); assert.equal(page.nextPage, 2);
  const detail = await queries.detail('e1'); assert.equal(detail?.description, '행사 내용'); assert.ok(!JSON.stringify(detail).includes('secret'));
  const args = calls as Array<{ where: unknown; skip: number }>;
  assert.deepEqual(args[0].where, { AND: [publishedEventWhere(now), { NOT: upcomingEventWhere(now) }] }); assert.equal(args[0].skip, 20);
  assert.deepEqual(args[1].where, { ...publishedEventWhere(now), id: 'e1' });
});
test('event handlers validate period, fail closed, mask errors; client validates responses', async () => {
  const query = () => ({ list: async () => ({ data: [], nextPage: null }), detail: async () => null });
  const handlers = createAppEventHandlers(query, () => true);
  for (const params of ['period=all', 'period=past&period=upcoming', 'page=-1']) assert.equal((await handlers.list(new Request(`http://test?${params}`))).status, 422);
  assert.equal((await handlers.detail('hidden')).status, 404);
  const disabled = createAppEventHandlers(() => { throw new Error('no read'); }, () => false);
  assert.equal((await disabled.detail('e1')).status, 503);
  const failed = createAppEventHandlers(() => { throw new Error('secret'); }, () => true);
  const response = await failed.detail('e1'); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('secret'));
  const client = createEventClient('http://test', async input => { assert.equal(new URL(String(input)).searchParams.get('period'), 'past'); return handlers.list(new Request(String(input))); });
  assert.deepEqual(await client.list(0, 'past'), { data: [], nextPage: null });
  await assert.rejects(createEventClient('http://test', async () => Response.json({ data: {} })).detail('e1'));
});
