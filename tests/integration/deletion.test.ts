import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@daegwang/database/generated/client';
import { createDeletionService, type DeletionProvider } from '@daegwang/server/features/member/deletion-service';
import { AccountOperationError } from '@daegwang/server/features/member/account-service';

const url = new URL(process.env.TEST_DATABASE_URL ?? 'http://invalid');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/daegwang_worship_test') throw new Error('Isolated local test database required');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });
after(() => db.$disconnect());
const policy = { version: 'test-only-v1', notice: 'Isolated test deletion', scope: 'ALL_MEMBER_DATA' as const, receiptRetentionDays: 1 };
const input = { password: 'test-password', policyVersion: policy.version, confirm: 'DELETE' };
const identity = (id: string) => ({ id, email: 'isolated@example.invalid' });
const provider: DeletionProvider = { reauthenticate: async () => {}, deleteIdentity: async () => {}, identityAbsent: async () => true };

test('deletion atomically removes all ten private data types, preserving other members and shared content', async () => {
  const ownerId = randomUUID(); const other = randomUUID(); const groupId = randomUUID();
  await db.churchGroup.create({ data: { id: groupId, name: 'Shared fixture' } });
  for (const owner of [ownerId, other]) {
    await db.memberRecord.create({ data: { ownerId: owner, kind: 'PRAYER', content: { body: 'Private fixture' } } });
    await db.memberBookmark.create({ data: { ownerId: owner, worshipId: 'shared-word', type: 'FIRST_HOUR' } });
    await db.memberSchedule.create({ data: { ownerId: owner, content: {}, startsAt: new Date('2026-10-05T00:00:00Z'), endsAt: new Date('2026-10-06T00:00:00Z') } });
    await db.memberNotification.create({ data: { ownerId: owner, category: 'NEWS', title: 'Fixture', body: '', dedupeKey: 'fixture' } });
    await db.memberNotificationPreference.create({ data: { ownerId: owner, content: {} } });
    await db.memberProfile.create({ data: { ownerId: owner } });
    await db.pendingRegistration.create({ data: { ownerId: owner, emailHash: 'hash', displayName: '', policyVersion: 'v1', termsHash: 'hash', privacyHash: 'hash', policySnapshot: {}, expiresAt: new Date() } });
    await db.memberCareRequest.create({ data: { ownerId: owner, content: {}, requestKey: randomUUID(), policyVersion: 'v1', expiresAt: new Date() } });
    await db.groupMembership.create({ data: { ownerId: owner, groupId, approvedBy: 'test' } });
    await db.groupPreference.create({ data: { ownerId: owner } });
  }
  const service = createDeletionService(db, provider);
  await Promise.all([service.request(identity(ownerId), input, policy), service.request(identity(ownerId), input, policy)]);
  const tables = ['member_records','member_bookmarks','member_schedules','member_notifications','member_notification_preferences','member_profiles','pending_registrations','member_care_requests','group_memberships','group_preferences'];
  for (const table of tables) {
    const rows = await db.$queryRawUnsafe<Array<{ ownerId: string }>>(`SELECT "ownerId" FROM "${table}" WHERE "ownerId" IN ($1::uuid,$2::uuid)`, ownerId, other);
    assert.deepEqual(rows.map(row => row.ownerId), [other], table);
  }
  assert.ok(await db.churchGroup.findUnique({ where: { id: groupId } }));
  assert.equal(await db.memberDeletion.count({ where: { ownerId } }), 1);
  await assert.rejects(db.memberRecord.create({ data: { ownerId, kind: 'PRAYER', content: {} } }));
  await assert.rejects(db.memberProfile.create({ data: { ownerId } }));
  await assert.rejects(db.groupMembership.create({ data: { ownerId, groupId, approvedBy: 'test' } }));
  await assert.rejects(db.adminProfile.create({ data: { authUserId: ownerId, email: `${ownerId}@example.invalid`, displayName: 'Cannot promote' } }));
  // Keep this job from the independent worker test batches below.
  await db.memberDeletion.update({ where: { ownerId }, data: { nextAttemptAt: new Date('2099-01-01') } });
  await db.memberCareRequest.deleteMany({ where: { ownerId: other } });
});

test('stale policy, wrong password, protected admins and rate limits cannot enqueue deletion', async () => {
  const ownerId = randomUUID(); let checks = 0;
  const service = createDeletionService(db, { ...provider, reauthenticate: async () => { checks++; throw new AccountOperationError(422); } });
  await assert.rejects(service.request(identity(ownerId), { ...input, policyVersion: 'old' }, policy), (e: unknown) => e instanceof AccountOperationError && e.status === 409);
  assert.equal(checks, 0);
  for (let i = 0; i < 5; i++) await assert.rejects(service.request(identity(ownerId), input, policy), (e: unknown) => e instanceof AccountOperationError && e.status === 422);
  await assert.rejects(service.request(identity(ownerId), input, policy), (e: unknown) => e instanceof AccountOperationError && e.status === 429);
  assert.equal(checks, 5); assert.equal(await db.memberDeletion.count({ where: { ownerId } }), 0);
  const adminId = randomUUID();
  await db.adminProfile.create({ data: { authUserId: adminId, email: `${adminId}@example.invalid`, displayName: 'Protected', isActive: false } });
  await assert.rejects(service.request(identity(adminId), input, policy), (e: unknown) => e instanceof AccountOperationError && e.status === 403);
  assert.equal(checks, 5);
});

test('database failure rolls back the receipt and all deletions together', async () => {
  const ownerId = randomUUID();
  await db.memberProfile.create({ data: { ownerId, displayName: 'must-survive' } });
  await db.memberRecord.create({ data: { ownerId, kind: 'PRAYER', content: { fault: 'deletion-rollback-test' } } });
  await db.$executeRawUnsafe(`CREATE FUNCTION test_deletion_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.content->>'fault' = 'deletion-rollback-test' THEN RAISE EXCEPTION 'Injected fixture failure'; END IF; RETURN OLD; END $$`);
  await db.$executeRawUnsafe('CREATE TRIGGER test_deletion_fault BEFORE DELETE ON member_records FOR EACH ROW EXECUTE FUNCTION test_deletion_fault()');
  try {
    await assert.rejects(createDeletionService(db, provider).request(identity(ownerId), input, policy));
    assert.equal(await db.memberDeletion.count({ where: { ownerId } }), 0);
    assert.equal(await db.memberRecord.count({ where: { ownerId } }), 1);
    assert.equal((await db.memberProfile.findUnique({ where: { ownerId } }))?.displayName, 'must-survive');
  } finally {
    await db.$executeRawUnsafe('DROP TRIGGER test_deletion_fault ON member_records');
    await db.$executeRawUnsafe('DROP FUNCTION test_deletion_fault()');
  }
});

test('concurrent workers lease once, recover a provider-success/response-failure, and retain receipts until confirmed absent', async () => {
  const ownerId = randomUUID(); let clock = new Date('2080-01-01'); let calls = 0; let absent = false;
  const service = createDeletionService(db, { ...provider, deleteIdentity: async () => { calls++; if (calls === 1) throw new Error('Provider deleted but response lost'); }, identityAbsent: async () => absent }, () => clock);
  await service.request(identity(ownerId), input, policy);
  await Promise.all([service.runBatch(), service.runBatch()]);
  assert.equal(calls, 1); assert.equal((await db.memberDeletion.findUnique({ where: { ownerId } }))?.status, 'PENDING');
  await service.runBatch(); assert.equal(calls, 1);
  clock = new Date(clock.getTime() + 60001);
  await service.runBatch(); assert.equal(calls, 2);
  assert.equal((await db.memberDeletion.findUnique({ where: { ownerId } }))?.status, 'COMPLETED');
  await service.runBatch(); assert.ok(await db.memberDeletion.findUnique({ where: { ownerId } }));
  clock = new Date(clock.getTime() + 86400001);
  await service.runBatch(); assert.ok(await db.memberDeletion.findUnique({ where: { ownerId } }));
  absent = true; await service.runBatch(); assert.equal(await db.memberDeletion.findUnique({ where: { ownerId } }), null);
});

test('a stale in-flight write cannot recreate data after an uncommitted tombstone commits; deletion queue denies public roles', async () => {
  const ownerId = randomUUID(); let release!: () => void; let locked!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }); const ready = new Promise<void>(resolve => { locked = resolve; });
  const transaction = db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
    await tx.memberDeletion.create({ data: { ownerId, policyVersion: policy.version, policySnapshot: policy, receiptRetentionDays: 1, nextAttemptAt: new Date('2099-01-01') } });
    locked(); await gate;
  });
  await ready;
  const staleWrite = assert.rejects(db.memberNotification.create({ data: { ownerId, category: 'NEWS', title: 'stale', body: '', dedupeKey: 'stale' } }));
  release(); await transaction; await staleWrite;
  assert.equal(await db.memberNotification.count({ where: { ownerId } }), 0);
  const [row] = await db.$queryRaw<Array<{ relrowsecurity: boolean; readable: boolean }>>`SELECT relrowsecurity, (has_table_privilege('anon',oid,'SELECT') OR has_table_privilege('authenticated',oid,'SELECT')) AS readable FROM pg_class WHERE oid='public.member_deletions'::regclass`;
  assert.equal(row.relrowsecurity, true); assert.equal(row.readable, false);
});
