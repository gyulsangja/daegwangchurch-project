import { z } from "zod";
import type { PrismaClient } from "@daegwang/database/generated/client";
import { appWorshipListSchema, appWorshipSnapshotSchema } from "@daegwang/contracts/features/worship/app-contract";

const cursorSchema = z.object({ startsAt: z.iso.datetime(), id: z.string().min(1).max(100) });
export class InvalidCursorError extends Error {}
export function createAppWorshipQueries(database: Pick<PrismaClient, "worshipPublication">, now = () => new Date()) {
  const visibility = () => ({ channel: "APP" as const, startsAt: { lte: now() },
    OR: [{ endsAt: null }, { endsAt: { gt: now() } }], worshipContent: { deletedAt: null } });
  const select = { id: true, worshipContentId: true, startsAt: true,
    publishedRevision: { select: { revisionNo: true, payload: true } } } as const;
  type Row = { worshipContentId: string; publishedRevision: { revisionNo: number; payload: unknown } };
  const dto = (row: Row) => ({ id: row.worshipContentId, version: row.publishedRevision.revisionNo, ...appWorshipSnapshotSchema.parse(row.publishedRevision.payload) });
  return {
    async list(input: unknown) {
      const query = appWorshipListSchema.parse(input);
      let cursor: z.infer<typeof cursorSchema> | undefined;
      if (query.cursor) {
        try { cursor = cursorSchema.parse(JSON.parse(Buffer.from(query.cursor, "base64url").toString("utf8"))); }
        catch { throw new InvalidCursorError(); }
      }
      const rows = await database.worshipPublication.findMany({
        where: { ...visibility(), publishedRevision: { type: query.type, payload: query.month ? { path: ["contentDate"], string_starts_with: query.month + "-" } : undefined },
          AND: cursor ? [{ OR: [ { startsAt: { lt: new Date(cursor.startsAt) } }, { startsAt: new Date(cursor.startsAt), id: { lt: cursor.id } } ] }] : undefined },
        select, orderBy: [{ startsAt: "desc" }, { id: "desc" }], take: query.limit + 1,
      });
      const page = rows.slice(0, query.limit);
      const last = page.at(-1);
      return { data: page.map(dto), nextCursor: rows.length > query.limit && last
        ? Buffer.from(JSON.stringify({ startsAt: last.startsAt.toISOString(), id: last.id })).toString("base64url") : null };
    },
    async detail(id: string) {
      const row = await database.worshipPublication.findFirst({ where: { ...visibility(), worshipContentId: id }, select });
      return row ? dto(row) : null;
    },
  };
}
