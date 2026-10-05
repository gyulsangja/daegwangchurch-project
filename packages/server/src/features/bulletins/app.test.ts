import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { bulletinVisibility, createAppBulletinQueries } from './app-query-core';
import { createAppBulletinHandlers } from './app-api';
import { createBulletinClient } from '@daegwang/api-client/bulletins';

test('bulletin queries filter published records and public PDFs, paginate and constrain December correctly', async () => {
  const date = new Date('2026-12-15T00:00:00Z');
  const calls: unknown[] = [];
  const row = { id: 'b1', title: '주보', worshipDate: date, summary: null, pdfMedia: { originalName: 'a.pdf', sizeBytes: 10, bucket: 'public', objectPath: 'a.pdf' } };
  const db = { bulletin: { findMany: async (args: unknown) => { calls.push(args); return Array(21).fill(row); }, findFirst: async (args: unknown) => { calls.push(args); return row; } } } as unknown as Pick<PrismaClient, 'bulletin'>;
  const queries = createAppBulletinQueries(db, 'https://example.com', () => date);
  const page = await queries.list(1, '2026-12'); assert.equal(page.data.length, 20); assert.equal(page.nextPage, 2);
  const detail = await queries.detail('b1'); assert.equal(detail?.pdf.url, 'https://example.com/storage/v1/object/public/public/a.pdf');
  const [list, item] = calls as Array<{ where: Record<string, unknown>; skip: number }>;
  assert.deepEqual(bulletinVisibility(date), { status: 'PUBLISHED', deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: date } }], pdfMedia: { visibility: 'PUBLIC', deletedAt: null, mimeType: 'application/pdf' } });
  assert.deepEqual(list.where, { ...bulletinVisibility(date), worshipDate: { gte: new Date('2026-12-01Z'), lt: new Date('2027-01-01Z') } });
  assert.equal(list.skip, 20); assert.deepEqual(item.where, { ...bulletinVisibility(date), id: 'b1' });
  assert.ok(!JSON.stringify(detail).includes('objectPath'));
});
test('bulletin HTTP validation, disabled service and missing PDF are distinct from empty', async () => {
  const queries = () => ({ list: async () => ({ data: [], nextPage: null }), detail: async () => null });
  const handlers = createAppBulletinHandlers(queries, () => true);
  for (const query of ['month=2026-13', 'month=2026-10&month=2026-11', 'page=-1']) assert.equal((await handlers.list(new Request(`http://test?${query}`))).status, 422);
  assert.equal((await handlers.detail('gone')).status, 404);
  assert.equal((await createAppBulletinHandlers(() => { throw new Error('must not read'); }, () => false).detail('b1')).status, 503);
  const client = createBulletinClient('http://test', async input => handlers.list(new Request(String(input))));
  assert.deepEqual(await client.list(0, '2026-10'), { data: [], nextPage: null });
  await assert.rejects(createBulletinClient('http://test', async () => Response.json({ data: {} })).detail('b1'));
});
