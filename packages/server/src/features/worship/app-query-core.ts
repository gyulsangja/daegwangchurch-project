import { z } from "zod";
import type { Prisma, PrismaClient } from "@daegwang/database/generated/client";
import { appWorshipListSchema, appWorshipSnapshotSchema } from "@daegwang/contracts/features/worship/app-contract";
import { worshipVisibility } from './public-query-core';

const cursorSchema = z.object({ isPinned: z.boolean(), contentDate: z.iso.datetime(), id: z.string().min(1).max(100) });
export class InvalidCursorError extends Error {}
export function createAppWorshipQueries(database: Pick<PrismaClient, "worshipPublication">, now = () => new Date()) {
  const visibility = () => ({ channel: "APP" as const, startsAt: { lte: now() },
    OR: [{ endsAt: null }, { endsAt: { gt: now() } }], worshipContent: worshipVisibility(now()) });
  const select = { id: true, worshipContentId: true, startsAt: true,
    worshipContent: { select: { isPinned: true, contentDate: true } },
    publishedRevision: { select: { revisionNo: true, payload: true } } } as const;
  type Row = { worshipContentId: string; publishedRevision: { revisionNo: number; payload: unknown } };
  const dto = (row: Row) => ({ id: row.worshipContentId, version: row.publishedRevision.revisionNo, ...appWorshipSnapshotSchema.parse(row.publishedRevision.payload) });
  return {
    async list(input: unknown) {
      const query = appWorshipListSchema.parse(input);
      const revision: Prisma.WorshipRevisionWhereInput[] = [];
      if (query.type) revision.push({ type: query.type });
      if (query.group) revision.push({ type: query.group === 'sunday' ? { in: ['SUNDAY_MORNING', 'SUNDAY_AFTERNOON'] } : query.group === 'special' ? { in: ['WEDNESDAY', 'SPECIAL', 'PRAISE'] } : { not: 'FIRST_HOUR' } });
      if (query.month) revision.push({ payload: { path: ['contentDate'], string_starts_with: query.month + '-' } });
      if (query.from) revision.push({ payload: { path: ['contentDate'], gte: query.from } });
      if (query.to) revision.push({ payload: { path: ['contentDate'], lte: query.to } });
      if (query.q) revision.push({ OR: ['title', 'sermonTitle', 'scriptureReference', 'preacher'].map(field => ({ payload: { path: [field], string_contains: query.q, mode: 'insensitive' as const } })) });
      if (query.preacher) revision.push({ payload: { path: ['preacher'], string_contains: query.preacher, mode: 'insensitive' } });
      if (query.scripture) revision.push({ payload: { path: ['scriptureReference'], string_contains: query.scripture, mode: 'insensitive' } });
      let cursor: z.infer<typeof cursorSchema> | undefined;
      if (query.cursor) {
        try { cursor = cursorSchema.parse(JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8"))); }
        catch { throw new InvalidCursorError(); }
      }
      const rows = await database.worshipPublication.findMany({
        where: { ...visibility(), publishedRevision: { AND: revision },
          AND: cursor ? [{ OR: [
            ...(cursor.isPinned ? [{ worshipContent: { isPinned: false } }] : []),
            { worshipContent: { isPinned: cursor.isPinned, contentDate: { lt: new Date(cursor.contentDate) } } },
            { worshipContent: { isPinned: cursor.isPinned, contentDate: new Date(cursor.contentDate), id: { lt: cursor.id } } },
          ] }] : undefined },
        select, orderBy: [{ worshipContent: { isPinned: 'desc' } }, { worshipContent: { contentDate: 'desc' } }, { worshipContentId: 'desc' }], take: query.limit + 1,
      });
      const page = rows.slice(0, query.limit);
      const last = page.at(-1);
      return { data: page.map(dto), nextCursor: rows.length > query.limit && last
        ? Buffer.from(JSON.stringify({ isPinned: last.worshipContent.isPinned, contentDate: last.worshipContent.contentDate.toISOString(), id: last.worshipContentId })).toString("base64url") : null };
    },
    async detail(id: string) {
      const row = await database.worshipPublication.findFirst({ where: { ...visibility(), worshipContentId: id }, select });
      return row ? dto(row) : null;
    },
  };
}
