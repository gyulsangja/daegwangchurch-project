import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createAppWorshipQueries } from './app-query-core';
import { createAppWorshipHandlers } from './app-api';
import { createWorshipClient } from '@daegwang/api-client/worship';
import { createPublicWorshipQueries } from './public-query-core';

test('WEB and APP share pinned/date ordering and cursor preserves the pinned boundary', async () => {
  const calls: Record<string, unknown>[] = [];
  const payload = { type: 'FIRST_HOUR', title: 'Shared word', contentDate: '2026-10-04', youtube: { videoId: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: null }, preacher: null, sermonTitle: null, scriptureReference: null, description: null, summary: null };
  const rows = ['b', 'a'].map(id => ({ id: `p-${id}`, worshipContentId: id, startsAt: new Date(), worshipContent: { isPinned: true, contentDate: new Date('2026-10-04Z') }, publishedRevision: { revisionNo: 1, payload } }));
  const db = { worshipPublication: { findMany: async (args: Record<string, unknown>) => { calls.push(args); return rows; } }, worshipContent: { findMany: async (args: Record<string, unknown>) => { calls.push(args); return []; } } } as unknown as Pick<PrismaClient, 'worshipPublication' | 'worshipContent'>;
  const app = createAppWorshipQueries(db);
  const page = await app.list({ limit: 1 });
  assert.ok(page.nextCursor);
  await app.list({ limit: 1, cursor: page.nextCursor });
  await createPublicWorshipQueries(db).list('FIRST_HOUR');
  assert.deepEqual(calls[0].orderBy, [{ worshipContent: { isPinned: 'desc' } }, { worshipContent: { contentDate: 'desc' } }, { worshipContentId: 'desc' }]);
  assert.deepEqual(calls[2].orderBy, [{ isPinned: 'desc' }, { contentDate: 'desc' }, { id: 'desc' }]);
  assert.deepEqual((calls[1].where as { AND: unknown }).AND, [{ OR: [
    { worshipContent: { isPinned: false } },
    { worshipContent: { isPinned: true, contentDate: { lt: new Date('2026-10-04Z') } } },
    { worshipContent: { isPinned: true, contentDate: new Date('2026-10-04Z'), id: { lt: 'b' } } },
  ] }]);
  assert.equal(page.data[0].title, payload.title);
});
test('search combines APP visibility, published snapshot filters and cursor without reading draft content', async () => {
  const calls: unknown[] = []; const now = new Date('2026-10-04T00:00:00Z');
  const db = { worshipPublication: { findMany: async (args: unknown) => { calls.push(args); return []; } } } as unknown as Pick<PrismaClient, 'worshipPublication'>;
  const queries = createAppWorshipQueries(db, () => now);
  await queries.list({ q: '요한', preacher: '목사', scripture: '15', group: 'sermon', from: '2026-10-01', to: '2026-10-31' });
  const args = calls[0] as { where: { channel: string; startsAt: unknown; OR: unknown; worshipContent: unknown; publishedRevision: { AND: unknown[] } }; select: unknown };
  assert.equal(args.where.channel, 'APP'); assert.deepEqual(args.where.worshipContent, { deletedAt: null, status: 'PUBLISHED', OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] });
  assert.deepEqual(args.where.startsAt, { lte: now }); assert.deepEqual(args.where.OR, [{ endsAt: null }, { endsAt: { gt: now } }]);
  assert.ok(JSON.stringify(args.where.publishedRevision).includes('string_contains')); assert.ok(JSON.stringify(args.where.publishedRevision).includes('scriptureReference'));
  assert.deepEqual((args.select as { worshipContent: unknown }).worshipContent, { select: { isPinned: true, contentDate: true } });
  const handlers = createAppWorshipHandlers(() => queries, () => true);
  for (const query of ['from=2026-11-01&to=2026-10-01', 'from=2026-02-30', 'q=', `q=${'a'.repeat(101)}`, 'q=a&q=b']) assert.equal((await handlers.list(new Request(`http://test?${query}`))).status, 422);
});
test('search client supports all types without changing the default devotional query', async () => {
  const urls: string[] = [];
  const client = createWorshipClient('https://example.com', async input => { urls.push(String(input)); return Response.json({ data: [], nextCursor: null }); });
  await client.list(); await client.list({ type: 'ALL', q: 'a & b', preacher: '목사', from: '2026-10-01' }); await client.list({ group: 'sunday' });
  assert.equal(new URL(urls[0]).searchParams.get('type'), 'FIRST_HOUR');
  assert.equal(new URL(urls[1]).searchParams.get('type'), null); assert.equal(new URL(urls[1]).searchParams.get('q'), 'a & b');
  assert.equal(new URL(urls[2]).searchParams.get('type'), null); assert.equal(new URL(urls[2]).searchParams.get('group'), 'sunday');
});
