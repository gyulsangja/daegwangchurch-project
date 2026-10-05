import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createAppNoticeQueries, publicAttachmentUrl } from './app-query-core';
import { createAppNoticeHandlers } from './app-api';
import { publishedNoticeWhere } from './public-policy';

const date = new Date('2026-10-04T00:00:00Z');
const row = { id: 'notice-1', title: '공지', category: '안내', isPinned: true, isImportant: false, publishedAt: date, updatedAt: date, createdAt: date, _count: { attachments: 1 } };
test('public notice policy excludes drafts, deleted, future and expired notices', () => {
  assert.deepEqual(publishedNoticeWhere(date), { status: 'PUBLISHED', deletedAt: null, AND: [
    { OR: [{ publishedAt: null }, { publishedAt: { lte: date } }] },
    { OR: [{ publishStartsAt: null }, { publishStartsAt: { lte: date } }] },
    { OR: [{ publishEndsAt: null }, { publishEndsAt: { gt: date } }] },
  ] });
});
test('list and detail enforce public predicates and return only public DTO fields', async () => {
  const calls: unknown[] = [];
  const db = { notice: {
    findMany: async (args: unknown) => { calls.push(args); return Array.from({ length: 21 }, () => row); },
    findFirst: async (args: unknown) => { calls.push(args); return { ...row, content: { body: '본문', internal: 'never return' }, attachments: [{ media: { id: 'media-1', originalName: '안내.pdf', mimeType: 'application/pdf', sizeBytes: 1200, bucket: 'public', objectPath: 'notices/안내.pdf' } }] }; },
  } } as unknown as Pick<PrismaClient, 'notice'>;
  const queries = createAppNoticeQueries(db, 'https://example.supabase.co', () => date);
  const page = await queries.list(1);
  assert.equal(page.data.length, 20); assert.equal(page.nextPage, 2);
  const detail = await queries.detail('notice-1');
  assert.equal(detail?.body, '본문');
  assert.equal(detail?.attachments[0].url, 'https://example.supabase.co/storage/v1/object/public/public/notices/%EC%95%88%EB%82%B4.pdf');
  assert.ok(!JSON.stringify(detail).includes('internal')); assert.ok(!JSON.stringify(detail).includes('objectPath'));
  const [listCall, detailCall] = calls as Array<{ where: unknown; skip: number; select: { attachments: { where: unknown }; _count: { select: { attachments: { where: unknown } } } } }>;
  assert.deepEqual(listCall.where, publishedNoticeWhere(date)); assert.equal(listCall.skip, 20);
  assert.deepEqual(detailCall.where, { ...publishedNoticeWhere(date), id: 'notice-1' });
  assert.deepEqual(detailCall.select.attachments.where, { media: { visibility: 'PUBLIC', deletedAt: null } });
  assert.deepEqual(listCall.select._count.select.attachments.where, detailCall.select.attachments.where);
});
test('notice HTTP handlers fail closed, validate query, and mask DB failures', async () => {
  let called = false;
  const unavailable = () => { called = true; throw new Error('postgres://secret'); };
  const disabled = createAppNoticeHandlers(unavailable, () => false);
  assert.equal((await disabled.list(new Request('http://test/notices'))).status, 503); assert.equal(called, false);
  const handlers = createAppNoticeHandlers(unavailable, () => true);
  for (const query of ['page=-1', 'page=1&page=2', 'secret=true']) assert.equal((await handlers.list(new Request(`http://test/notices?${query}`))).status, 422);
  assert.equal((await handlers.detail('../bad')).status, 404);
  const response = await handlers.list(new Request('http://test/notices'));
  assert.equal(response.status, 503); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.ok(!(await response.text()).includes('secret'));
  const missing = createAppNoticeHandlers(() => ({ list: async () => ({ data: [], nextPage: null }), detail: async () => null }), () => true);
  assert.equal((await missing.detail('hidden')).status, 404);
  assert.deepEqual(await (await missing.list(new Request('http://test/notices'))).json(), { data: [], nextPage: null });
});
test('attachment URLs reject unsafe schemes and dot segments', () => {
  assert.throws(() => publicAttachmentUrl('javascript:alert(1)', 'public', 'a.pdf'));
  assert.throws(() => publicAttachmentUrl('https://example.com', 'public', '../a.pdf'));
});

test('public prayer category is enforced on list and direct detail without weakening publication rules', async () => {
  const calls: Array<{ where: unknown }> = [];
  const db = { notice: {
    findMany: async (args: { where: unknown }) => { calls.push(args); return []; },
    findFirst: async (args: { where: unknown }) => { calls.push(args); return null; },
  } } as unknown as Pick<PrismaClient, 'notice'>;
  const query = createAppNoticeQueries(db, undefined, () => date, '공동기도');
  assert.deepEqual(await query.list(0), { data: [], nextPage: null });
  assert.equal(await query.detail('ordinary-notice'), null);
  assert.deepEqual(calls[0].where, { ...publishedNoticeWhere(date), category: '공동기도' });
  assert.deepEqual(calls[1].where, { ...publishedNoticeWhere(date), category: '공동기도', id: 'ordinary-notice' });
});
