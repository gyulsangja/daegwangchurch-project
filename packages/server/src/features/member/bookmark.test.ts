import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createBookmarkService } from './bookmark-service';
import { MemberRecordNotFound } from './record-service';
const owner = '11111111-1111-4111-8111-111111111111';
test('bookmarks deduplicate by owner and target, recheck publication, and scope deletion to owner', async () => {
  const calls: Array<Record<string, unknown>> = []; let visible = true;
  const row = { id: 'b1', ownerId: owner, worshipId: 'w1', type: 'FIRST_HOUR', createdAt: new Date() };
  const db = { memberBookmark: {
    upsert: async (args: Record<string, unknown>) => { calls.push(args); return row; },
    findMany: async (args: Record<string, unknown>) => { calls.push(args); return [row]; },
    findFirst: async (args: { where: { ownerId: string } }) => args.where.ownerId === owner ? row : null,
    deleteMany: async (args: Record<string, unknown>) => { calls.push(args); return { count: 1 }; },
  } } as unknown as Pick<PrismaClient, 'memberBookmark'>;
  const worship = { id: 'w1', version: 1, type: 'FIRST_HOUR' as const, title: '공개 묵상', contentDate: '2026-10-04', scriptureReference: null, preacher: null, sermonTitle: null, description: null, summary: null, youtube: { videoId: 'T0000000001', url: 'https://www.youtube.com/watch?v=T0000000001', thumbnailUrl: null } };
  const service = createBookmarkService(db, owner, async () => visible ? worship : null);
  await service.create({ worshipId: 'w1' }); await service.create({ worshipId: 'w1' });
  assert.deepEqual(calls[0].where, { ownerId_worshipId: { ownerId: owner, worshipId: 'w1' } });
  assert.deepEqual(calls[1].where, calls[0].where);
  visible = false;
  assert.equal((await service.list({})).data[0].worship, null);
  assert.equal((calls[2].where as { ownerId: string }).ownerId, owner);
  await assert.rejects(service.create({ worshipId: 'w1' }), MemberRecordNotFound);
  await service.remove('b1', {}); assert.deepEqual(calls.at(-1)?.where, { id: 'b1', ownerId: owner });
  await assert.rejects(createBookmarkService(db, '22222222-2222-4222-8222-222222222222', async () => worship).detail('b1'), MemberRecordNotFound);
});
