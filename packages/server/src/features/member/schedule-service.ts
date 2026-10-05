import { z } from 'zod';
import type { Prisma, PrismaClient } from '@daegwang/database/generated/client';
import { memberScheduleInputSchema, memberScheduleListSchema, memberScheduleSchema, memberScheduleUpdateSchema, personalScheduleBounds } from '@daegwang/contracts/features/member/schedules';
import type { Event } from '@daegwang/contracts/features/events/app-contract';
import { publishedEventWhere } from '../events/public-policy';
import { monthBounds } from '@daegwang/contracts/features/calendar';
import { eventOnDateWhere, eventInMonthWhere } from '../events/app-query-core';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';
export function createScheduleService(db: Pick<PrismaClient, 'memberSchedule'>, userId: string, publishedEvent: (id: string) => Promise<Event | null>, now = () => new Date()) {
  const ownerId = z.uuid().parse(userId);
  const dto = async (row: { id: string; version: number; eventId: string | null; content: unknown }) => memberScheduleSchema.parse({ id: row.id, version: row.version, eventId: row.eventId, content: row.content, event: row.eventId ? await publishedEvent(row.eventId) : null });
  return {
    async list(input: unknown) {
      const query = memberScheduleListSchema.parse(input); const conditions: Prisma.MemberScheduleWhereInput[] = [];
      if (query.group === 'personal') conditions.push({ eventId: null });
      if (query.group === 'saved') conditions.push({ eventId: { not: null } });
      if (query.month && !query.date) {
        const { start, end } = monthBounds(query.month);
        conditions.push({ OR: [{ eventId: null, startsAt: { lt: end }, endsAt: { gt: start } }, { event: { AND: [publishedEventWhere(now()), eventInMonthWhere(query.month)] } }] });
      }
      if (query.date) {
        const start = new Date(`${query.date}T00:00:00+09:00`); const end = new Date(start.getTime() + 86400000);
        conditions.push({ OR: [{ eventId: null, startsAt: { lt: end }, endsAt: { gt: start } }, { event: { AND: [publishedEventWhere(now()), eventOnDateWhere(query.date)] } }] });
      }
      const rows = await db.memberSchedule.findMany({ where: { ownerId, eventId: query.eventId, AND: conditions }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: query.page * 20, take: 21 });
      return { data: await Promise.all(rows.slice(0, 20).map(dto)), nextPage: rows.length > 20 ? query.page + 1 : null };
    },
    async detail(id: string) { const row = await db.memberSchedule.findFirst({ where: { id, ownerId } }); if (!row) throw new MemberRecordNotFound(); return dto(row); },
    async create(input: unknown) {
      const content = memberScheduleInputSchema.parse(input);
      if (content.kind === 'CHURCH') {
        if (!await publishedEvent(content.eventId)) throw new MemberRecordNotFound();
        return dto(await db.memberSchedule.upsert({ where: { ownerId_eventId: { ownerId, eventId: content.eventId } }, create: { ownerId, eventId: content.eventId }, update: {} }));
      }
      return dto(await db.memberSchedule.create({ data: { ownerId, content, ...personalScheduleBounds(content) } }));
    },
    async update(id: string, input: unknown) {
      const { version, content } = memberScheduleUpdateSchema.parse(input);
      const row = await db.memberSchedule.findFirst({ where: { id, ownerId }, select: { eventId: true } });
      if (!row) throw new MemberRecordNotFound(); if (row.eventId) throw new MemberRecordConflict();
      const result = await db.memberSchedule.updateMany({ where: { id, ownerId, version, eventId: null }, data: { content, ...personalScheduleBounds(content), version: { increment: 1 } } });
      if (!result.count) throw new MemberRecordConflict(); return { id, version: version + 1 };
    },
    async remove(id: string, input: unknown) { const { version } = z.object({ version: z.number().int().positive() }).strict().parse(input); const row = await db.memberSchedule.findFirst({ where: { id, ownerId }, select: { id: true } }); if (!row) throw new MemberRecordNotFound(); const result = await db.memberSchedule.deleteMany({ where: { id, ownerId, version } }); if (!result.count) throw new MemberRecordConflict(); },
  };
}
