import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { createAdminMemberManagement, AdminMemberError } from './admin-management';
const owner = '11111111-1111-4111-8111-111111111111';
const actorOwner = '22222222-2222-4222-8222-222222222222';
function fixture() {
  const deleted: string[] = []; let active = false; let authorized = true; let pending = false; let completed = false;
  const tx = {
    $executeRaw: async () => 1,
    $queryRaw: async () => [{ email: 'member@example.invalid' }],
    adminProfile: {
      findFirst: async () => authorized ? { authUserId: actorOwner } : null,
      findUnique: async () => ({ id: 'old-admin', isActive: active }),
      update: async ({ data }: { data: { isActive?: boolean } }) => { if (data.isActive === false) active = false; },
    },
    memberProfile: { findUnique: async () => null, deleteMany: async ({ where }: { where: {ownerId:string} }) => { assert.equal(where.ownerId, owner); deleted.push('profile'); } },
    memberDeletion: { findUnique: async () => pending ? {} : null, create: async () => { pending = true; }, update: async () => { completed = true; } },
    groupManager: { deleteMany: async () => ({count:0}) },
    activityLog: { create: async () => ({}) },
    ...Object.fromEntries(['memberRecord','memberBookmark','memberSchedule','memberPushDevice','memberNotification','memberNotificationPreference','memberCareRequest','groupMembership','groupPreference','pendingRegistration'].map(name => [name, { deleteMany: async ({where}: {where:{ownerId:string}}) => { assert.equal(where.ownerId,owner); deleted.push(name); } }])),
  };
  const db = { ...tx, $transaction: async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as PrismaClient;
  return { db, deleted, setActive: (value: boolean) => { active = value; }, setAuthorized: (value: boolean) => { authorized = value; }, state: () => ({active,pending,completed}) };
}
test('administrator management blocks unauthorised, self and active-admin deletion before data changes', async () => {
  const f=fixture(); let providerCalls=0;
  const service=createAdminMemberManagement(f.db,{deleteIdentity:async()=>{providerCalls++;}});
  const input={ownerId:owner,email:'member@example.invalid',confirm:'DELETE'};
  f.setAuthorized(false); await assert.rejects(service.remove('actor',input),AdminMemberError);
  f.setAuthorized(true); await assert.rejects(service.remove('actor',{...input,ownerId:actorOwner}),AdminMemberError);
  f.setActive(true); await assert.rejects(service.remove('actor',input),AdminMemberError);
  f.setActive(false); await assert.rejects(service.remove('actor',{...input,email:'wrong@example.invalid'}),AdminMemberError);
  assert.equal(providerCalls,0); assert.deepEqual(f.deleted,[]);
});
test('revocation preserves member data, deletion failure is resumable without deleting data again', async () => {
  const f=fixture(); f.setActive(true); let fail=true;
  const service=createAdminMemberManagement(f.db,{deleteIdentity:async()=>{if(fail)throw new Error('provider offline');}});
  await service.role('actor',{ownerId:owner,role:'MEMBER'});
  assert.equal(f.state().active,false); assert.deepEqual(f.deleted,[]);
  const input={ownerId:owner,email:'member@example.invalid',confirm:'DELETE'};
  assert.equal((await service.remove('actor',input)).completed,false);
  assert.equal(f.state().pending,true); assert.equal(f.deleted.length,11);
  fail=false; assert.equal((await service.remove('actor',input)).completed,true);
  assert.equal(f.state().completed,true); assert.equal(f.deleted.length,11);
});

test('church details replace affiliations without revoking membership and guard stale or unauthorized edits', async () => {
  let authorized = true; let deleting = false; let status = 'CONFIRMED'; let version = 3; let position = '성도'; let hasRecord = true; let accountExists = true;
  let groups = ['old'];
  const tx = {
    $executeRaw: async () => 1,
    $queryRaw: async () => accountExists ? [{ id: owner }] : [],
    memberProfile: { upsert: async () => ({}) },
    adminProfile: { findFirst: async () => authorized ? {} : null },
    memberDeletion: { findUnique: async () => deleting ? {} : null },
    churchMembership: {
      findUnique: async () => hasRecord ? ({ status, version, position }) : null,
      upsert: async ({ update }: { update: { position: string } }) => { position = update.position; version++; hasRecord = true; },
    },
    churchGroup: { count: async ({ where }: { where: { id: { in: string[] } } }) => where.id.in.filter(id => id === 'new').length },
    groupMembership: {
      deleteMany: async ({ where }: { where: { groupId: { notIn: string[] } } }) => { groups = groups.filter(id => where.groupId.notIn.includes(id)); },
      upsert: async ({ create }: { create: { groupId: string } }) => { if (!groups.includes(create.groupId)) groups.push(create.groupId); },
    },
    activityLog: { create: async () => ({}) },
  };
  const db = { $transaction: async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx) } as unknown as PrismaClient;
  const service = createAdminMemberManagement(db);
  const input = { ownerId: owner, version: 3, position: ' 집사 ', groupIds: ['new'] };
  authorized = false; await assert.rejects(service.churchDetails('actor', input), AdminMemberError);
  authorized = true; deleting = true; await assert.rejects(service.churchDetails('actor', input), AdminMemberError);
  deleting = false; await assert.rejects(service.churchDetails('actor', { ...input, groupIds: ['inactive'] }), AdminMemberError);
  assert.deepEqual(groups, ['old']); assert.equal(position, '성도');
  await service.churchDetails('actor', input);
  assert.deepEqual(groups, ['new']); assert.equal(position, '집사'); assert.equal(status, 'CONFIRMED');
  await assert.rejects(service.churchDetails('actor', input), AdminMemberError);
  await service.churchDetails('actor', { ...input, version: 4, groupIds: [] });
  assert.deepEqual(groups, []); assert.equal(status, 'CONFIRMED');
  status = 'PENDING';
  await assert.rejects(service.churchDetails('actor', { ...input, version: 5 }), AdminMemberError);
  await service.churchDetails('actor', { ...input, version: 5, groupIds: [], position: '성도' });
  assert.equal(status, 'PENDING'); assert.equal(position, '성도');
  status = 'UNCONFIRMED';
  await service.churchDetails('actor', { ...input, version: 6, groupIds: [], position: '장로' });
  assert.equal(status, 'UNCONFIRMED'); assert.equal(position, '장로');
  hasRecord = false; version = 0; accountExists = false;
  await assert.rejects(service.churchDetails('actor', { ...input, version: 0, groupIds: [] }), AdminMemberError);
  assert.equal(hasRecord, false);
  accountExists = true;
  await service.churchDetails('actor', { ...input, version: 0, groupIds: [] });
  assert.equal(hasRecord, true); assert.equal(version, 1); assert.equal(status, 'UNCONFIRMED');
});
