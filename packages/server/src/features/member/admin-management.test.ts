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
