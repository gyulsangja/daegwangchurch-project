import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createDirectory, DirectoryError, type Actor } from '../packages/ministry-core/src/directory';
import { createFixture } from '../packages/ministry-core/src/fixture';
import { isLocalReviewEnabled, isLocalMutationOrigin } from '../packages/ministry-core/src/local-access';

const admin: Actor = { id: 'admin', churchId: 'demo-daegwang', role: 'ADMIN', organizationIds: [] };
const leader: Actor = { ...admin, id: 'leader', role: 'LEADER', organizationIds: ['org-youth'] };
const input = { name: '가상 등록', status: 'ACTIVE', position: '', phone: '', address: '', organizationIds: ['org-youth'] };
const make = () => createDirectory(createFixture(), randomUUID, () => '2026-10-21T00:00:00.000Z');
const code = (expected: string) => (error: unknown) => error instanceof DirectoryError && error.code === expected;

test('every read is church scoped; leader can only read assigned organizations and no private profile', () => {
  const directory = make();
  assert.equal(directory.list(admin).total, 14);
  assert.equal(directory.list({ ...admin, churchId: 'demo-other' }).total, 1);
  assert.throws(() => directory.detail(admin, 'other-member'), code('NOT_FOUND'));
  assert.throws(() => directory.list({ ...admin, churchId: 'unknown' }), code('FORBIDDEN'));
  const members = directory.list(leader).items;
  assert.ok(members.length > 0);
  assert.ok(members.every(m => m.organizationIds.includes('org-youth')));
  const detail = directory.detail(leader, members[0].id);
  assert.equal(detail.privateProfile, null); assert.equal(detail.family, null); assert.deepEqual(detail.history, []);
  assert.ok(!JSON.stringify(directory.list(admin)).includes('phone'));
  assert.throws(() => directory.detail(leader, 'demo-member-2'), code('NOT_FOUND'));
});
test('write rejects other church links, leader, forged identity, unknown codes, duplicate affiliations', () => {
  const directory = make();
  assert.throws(() => directory.create(leader, input), code('FORBIDDEN'));
  for (const changed of [{ organizationIds: ['org-other'] }, { organizationIds: ['org-youth', 'org-youth'] }, { status: 'FAKE' }, { position: 'FAKE' }]) assert.throws(() => directory.create(admin, { ...input, ...changed }), code('INVALID'));
  assert.throws(() => directory.create(admin, { ...input, churchId: 'demo-other' }));
  assert.throws(() => directory.create(admin, { ...input, actorId: 'other' }));
  assert.equal(directory.list(admin).total, 14);
  assert.throws(() => directory.update(admin, 'other-member', { ...input, version: 1 }), code('NOT_FOUND'));
});
test('same names remain distinct; stale update cannot overwrite; audit contains field names only', () => {
  const directory = make(); const one = directory.create(admin, input); const two = directory.create(admin, input);
  assert.notEqual(one.id, two.id);
  assert.equal(directory.list(admin, { q: input.name }).total, 2);
  directory.update(admin, one.id, { ...input, name: '가상 수정', phone: '000-0000-0000', version: 1 });
  assert.throws(() => directory.update(admin, one.id, { ...input, version: 1 }), code('CONFLICT'));
  const detail = directory.detail(admin, one.id);
  assert.equal(detail.name, '가상 수정'); assert.equal(detail.version, 2);
  assert.deepEqual(detail.history[0].fields, ['name', 'phone']);
  assert.ok(!JSON.stringify(detail.history).includes('000-0000'));
});
test('filters and pagination are stable and returned arrays cannot mutate stored data', () => {
  const directory = make(); const first = directory.list(admin); const second = directory.list(admin, { page: 2 });
  assert.equal(first.items.length, 12); assert.equal(second.items.length, 2);
  assert.equal(new Set([...first.items, ...second.items].map(m => m.id)).size, 14);
  assert.equal(directory.list(admin, { status: 'NEW' }).total, 2);
  const config = directory.config(admin); config.organizations[0].name = 'changed';
  first.items[0].organizationIds.push('org-other');
  assert.notEqual(directory.config(admin).organizations[0].name, 'changed');
  assert.ok(directory.list(admin).items.every(m => !m.organizationIds.includes('org-other')));
});
test('local review cannot be enabled in production or from an outside host/origin', () => {
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'production', MINISTRY_LOCAL_DEMO: 'true' }, 'localhost:3002'), false);
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'development' }, 'localhost:3002'), false);
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'development', MINISTRY_LOCAL_DEMO: 'true' }, 'evil.example:3002'), false);
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'development', MINISTRY_LOCAL_DEMO: 'true' }, 'localhost:3002'), true);
  assert.equal(isLocalMutationOrigin('localhost:3002', 'https://evil.example'), false);
  assert.equal(isLocalMutationOrigin('localhost:3002', null), false);
  assert.equal(isLocalMutationOrigin('localhost:3002', 'http://localhost:3002'), true);
});
