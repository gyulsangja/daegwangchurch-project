import { monthBounds } from '@daegwang/contracts/features/calendar';
import type { Prisma, PrismaClient } from '@daegwang/database/generated/client';
import { eventSchema, eventSummarySchema } from '@daegwang/contracts/features/events/app-contract';
import { publishedEventWhere } from './public-policy';

export function upcomingEventWhere(now: Date): Prisma.EventWhereInput {
  const koreaDay = new Date(Math.floor((now.getTime() + 9 * 3600000) / 86400000) * 86400000 - 9 * 3600000);
  return { OR: [
    { isAllDay: false, endsAt: { gt: now } },
    { isAllDay: false, endsAt: null, startsAt: { gte: now } },
    { isAllDay: true, endsAt: { gte: koreaDay } },
    { isAllDay: true, endsAt: null, startsAt: { gte: koreaDay } },
  ] };
}
const select = { id: true, title: true, category: true, startsAt: true, endsAt: true, isAllDay: true, location: true, ministryName: true } as const;
export function eventOnDateWhere(date: string): Prisma.EventWhereInput {
  const start = new Date(`${date}T00:00:00+09:00`); const end = new Date(start.getTime() + 86400000);
  return { startsAt: { lt: end }, OR: [{ endsAt: { gt: start } }, { isAllDay: true, endsAt: { gte: start } }, { endsAt: null, startsAt: { gte: start } }] };
}
export function eventInMonthWhere(month: string): Prisma.EventWhereInput {
  const { start, end } = monthBounds(month);
  return { startsAt: { lt: end }, OR: [{ endsAt: { gt: start } }, { isAllDay: true, endsAt: { gte: start } }, { endsAt: null, startsAt: { gte: start } }] };
}
type Row = { id: string; title: string; category: string; startsAt: Date; endsAt: Date | null; isAllDay: boolean; location: string | null; ministryName: string | null };
const dto = (row: Row) => eventSummarySchema.parse({ ...row, startsAt: row.startsAt.toISOString(), endsAt: row.endsAt?.toISOString() ?? null });
export function createAppEventQueries(database: Pick<PrismaClient, 'event'>, now = () => new Date()) {
  return {
    async list(page: number, period: 'upcoming' | 'past', date?: string, month?: string) {
      const time = now();
      const upcoming = upcomingEventWhere(time);
      const direction = !date && !month && period === 'past' ? 'desc' as const : 'asc' as const;
      const rows = await database.event.findMany({ where: { AND: [publishedEventWhere(time), date ? eventOnDateWhere(date) : month ? eventInMonthWhere(month) : period === 'past' ? { NOT: upcoming } : upcoming] }, select,
        orderBy: [{ startsAt: direction }, { id: direction }], skip: page * 20, take: 21 });
      return { data: rows.slice(0, 20).map(dto), nextPage: rows.length > 20 ? page + 1 : null };
    },
    async detail(id: string) {
      const row = await database.event.findFirst({ where: { ...publishedEventWhere(now()), id }, select: { ...select, description: true } });
      if (!row) return null;
      const raw = row.description;
      const description = typeof raw === 'string' ? raw : raw && typeof raw === 'object' && !Array.isArray(raw) && typeof raw.body === 'string' ? raw.body : '';
      return eventSchema.parse({ ...dto(row), description });
    },
  };
}
