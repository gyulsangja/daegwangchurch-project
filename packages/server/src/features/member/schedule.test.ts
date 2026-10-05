import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { personalScheduleBounds, personalScheduleSchema } from '@daegwang/contracts/features/member/schedules';
import { createScheduleService } from './schedule-service';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';
const owner = '11111111-1111-4111-8111-111111111111';
const content = { kind: 'PERSONAL' as const, title: '개인 일정', startDate: '2026-10-04', endDate: '2026-10-04', allDay: false, startTime: '10:00', endTime: '11:00', location: '', note: '' };
test('personal schedules validate clock ordering and use Korean inclusive all-day dates', () => {
  assert.equal(personalScheduleSchema.safeParse({ ...content, endTime: '09:00' }).success, false);
  assert.equal(personalScheduleSchema.safeParse({ ...content, startDate: '2026-02-30' }).success, false);
  assert.equal(personalScheduleSchema.safeParse({ ...content, allDay: false, startTime: null }).success, false);
  const bounds = personalScheduleBounds({ ...content, allDay: true, endDate: '2026-10-05', startTime: null, endTime: null });
  assert.equal(bounds.startsAt.toISOString(), '2026-10-03T15:00:00.000Z'); assert.equal(bounds.endsAt.toISOString(), '2026-10-05T15:00:00.000Z');
});
test('schedule reads/writes stay owner scoped, reject conflicts and prohibit edits of official events', async () => {
  const calls: Array<{ op: string; args: Record<string, unknown> }> = []; let official = false;
  const row = { id: 's1', ownerId: owner, version: 1, eventId: null, content };
  const db = { memberSchedule: {
    findMany: async (args: Record<string, unknown>) => { calls.push({ op: 'list', args }); return [row]; },
    findFirst: async (args: { where: { ownerId: string } }) => args.where.ownerId === owner ? { ...row, eventId: official ? 'e1' : null } : null,
    create: async (args: Record<string, unknown>) => { calls.push({ op: 'create', args }); return row; },
    updateMany: async (args: { where: { version: number } }) => { calls.push({ op: 'update', args }); return { count: args.where.version === 1 ? 1 : 0 }; },
    deleteMany: async (args: Record<string, unknown>) => { calls.push({ op: 'delete', args }); return { count: 1 }; },
  } } as unknown as Pick<PrismaClient, 'memberSchedule'>;
  const service = createScheduleService(db, owner, async () => null);
  await service.list({ date: '2026-10-04' }); await service.create(content); await service.update('s1', { version: 1, content }); await service.remove('s1', { version: 1 });
  for (const { op, args } of calls) assert.equal((args[op === 'create' ? 'data' : 'where'] as { ownerId: string }).ownerId, owner);
  assert.ok(JSON.stringify(calls[0]).includes('2026-10-03T15:00:00.000Z'));
  await assert.rejects(service.update('s1', { version: 2, content }), MemberRecordConflict);
  official = true; await assert.rejects(service.update('s1', { version: 1, content }), MemberRecordConflict);
  const foreign = createScheduleService(db, '22222222-2222-4222-8222-222222222222', async () => null);
  await assert.rejects(foreign.detail('s1'), MemberRecordNotFound); await assert.rejects(foreign.remove('s1', { version: 1 }), MemberRecordNotFound);
  await assert.rejects(service.create({ kind: 'CHURCH', eventId: 'hidden' }), MemberRecordNotFound);
});
