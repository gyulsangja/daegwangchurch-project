import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createMemberRecordService, MemberRecordConflict, MemberRecordNotFound } from './record-service';
import { createMemberRecordHandler } from './record-api';
const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const content = { kind: 'PRAYER' as const, title: '', body: '개인 기도', date: '2026-10-04' };
test('record owner scope applies to every read/write; stale version cannot overwrite', async () => {
  const calls: Array<{ operation: string; args: Record<string, unknown> }> = [];
  const row = { id: 'r1', ownerId: owner, content, kind: 'PRAYER', version: 1, createdAt: new Date(), updatedAt: new Date() };
  const db = { memberRecord: {
    findMany: async (args: Record<string, unknown>) => { calls.push({ operation: 'list', args }); return [row]; },
    findFirst: async (args: Record<string, unknown>) => { calls.push({ operation: 'read', args }); return (args.where as { ownerId: string }).ownerId === owner ? row : null; },
    create: async (args: Record<string, unknown>) => { calls.push({ operation: 'create', args }); return row; },
    updateMany: async (args: Record<string, unknown>) => { calls.push({ operation: 'update', args }); return { count: (args.where as { version: number }).version === 1 ? 1 : 0 }; },
    deleteMany: async (args: Record<string, unknown>) => { calls.push({ operation: 'delete', args }); return { count: 1 }; },
  } } as unknown as Pick<PrismaClient, 'memberRecord'>;
  const service = createMemberRecordService(db, owner);
  assert.ok(!JSON.stringify(await service.list({})).includes('ownerId'));
  await service.create(content); await service.detail('r1'); await service.update('r1', { version: 1, content }); await service.remove('r1', { version: 1 });
  for (const { operation, args } of calls) assert.equal((args[operation === 'create' ? 'data' : 'where'] as { ownerId: string }).ownerId, owner);
  await assert.rejects(service.update('r1', { version: 2, content }), MemberRecordConflict);
  const foreign = createMemberRecordService(db, other);
  await assert.rejects(foreign.detail('r1'), MemberRecordNotFound);
  await assert.rejects(foreign.update('r1', { version: 1, content }), MemberRecordNotFound);
  await assert.rejects(foreign.remove('r1', { version: 1 }), MemberRecordNotFound);
  await assert.rejects(service.create({ ...content, ownerId: other }));
});
test('member API requires bearer identity, rejects foreign origins and never trusts body owner', async () => {
  let observedOwner = ''; let calls = 0;
  const handler = createMemberRecordHandler({ enabled: () => true, allowedOrigins: () => ['https://app.example.com'], authenticate: async token => token === 'valid' ? owner : null,
    service: userId => { observedOwner = userId; return { list: async () => { calls++; return { data: [], nextPage: null }; } } as unknown as ReturnType<typeof createMemberRecordService>; } });
  assert.equal((await handler(new Request('https://api.example.com/records'))).status, 401);
  assert.equal((await handler(new Request('https://api.example.com/records', { headers: { Authorization: 'Bearer wrong' } }))).status, 401);
  assert.equal((await handler(new Request('https://api.example.com/records', { headers: { Authorization: 'Bearer valid', Origin: 'https://evil.example.com' } }))).status, 403);
  assert.equal(calls, 0);
  const response = await handler(new Request('https://api.example.com/records', { headers: { Authorization: 'Bearer valid', Origin: 'https://app.example.com' } }));
  assert.equal(response.status, 200); assert.equal(observedOwner, owner); assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://app.example.com');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('reflection references use the published server snapshot; foreign reflection links cannot be written', async () => {
  const worship = { id: 'w1', version: 2, title: '공개 말씀', contentDate: '2026-10-04', scriptureReference: '요한복음 15:1' };
  let saved: unknown;
  const db = { memberRecord: {
    create: async ({ data }: { data: { content: unknown } }) => { saved = data.content; return { id: 'r1', content: data.content, version: 1, createdAt: new Date(), updatedAt: new Date() }; },
    findFirst: async () => null,
  } } as unknown as Pick<PrismaClient, 'memberRecord'>;
  const service = createMemberRecordService(db, owner, async id => id === 'w1' ? worship : null);
  await service.create({ kind: 'REFLECTION', body: '묵상', date: '2026-10-04', worship: { ...worship, title: '위조 제목', version: 999 } });
  assert.deepEqual((saved as { worship: unknown }).worship, worship);
  await assert.rejects(service.create({ kind: 'REFLECTION', body: '묵상', date: '2026-10-04', worship: { ...worship, id: 'hidden' } }), MemberRecordNotFound);
  await assert.rejects(service.create({ ...content, reflectionId: 'foreign-record' }), MemberRecordNotFound);
});
test('member HTTP mutations reject invalid JSON and oversized bodies, hide DB errors', async () => {
  const handler = createMemberRecordHandler({ enabled: () => true, allowedOrigins: () => [], authenticate: async () => owner, service: () => ({ create: async () => { throw new Error('private-database-detail'); } }) as unknown as ReturnType<typeof createMemberRecordService> });
  const post = (body: string) => handler(new Request('https://api.example.com/records', { method: 'POST', headers: { Authorization: 'Bearer valid', 'Content-Type': 'application/json' }, body }));
  assert.equal((await post('{')).status, 422);
  assert.equal((await post('x'.repeat(262145))).status, 413);
  const result = await post('{}'); assert.equal(result.status, 503); assert.ok(!(await result.text()).includes('private-database-detail'));
});

test('a prayer remains editable after its linked reflection is deleted, but cannot acquire a foreign link', async () => {
  let writes = 0;
  const previous = { ...content, reflectionId: 'deleted-reflection' };
  const db = { memberRecord: {
    findFirst: async ({ where }: { where: { id: string; ownerId: string } }) => where.id === 'prayer-1' && where.ownerId === owner ? { id: 'prayer-1', kind: 'PRAYER', content: previous } : null,
    updateMany: async () => { writes++; return { count: 1 }; },
  } } as unknown as Pick<PrismaClient, 'memberRecord'>;
  const service = createMemberRecordService(db, owner);
  await service.update('prayer-1', { version: 1, content: { ...previous, body: '수정한 기도' } });
  assert.equal(writes, 1);
  await assert.rejects(service.update('prayer-1', { version: 2, content: { ...previous, reflectionId: 'foreign-reflection' } }), MemberRecordNotFound);
  assert.equal(writes, 1);
});
