import { z } from 'zod';
import type { PrismaClient, WorshipContentType } from '@daegwang/database/generated/client';
import type { AppWorship } from '@daegwang/contracts/features/worship/app-contract';
import { bookmarkInputSchema, bookmarkListSchema, bookmarkSchema } from '@daegwang/contracts/features/member/bookmarks';
import { MemberRecordNotFound } from './record-service';
export function createBookmarkService(db: Pick<PrismaClient, 'memberBookmark'>, userId: string, publishedWorship: (id: string) => Promise<AppWorship | null>) {
  const ownerId = z.uuid().parse(userId);
  const dto = async (row: { id: string; worshipId: string; createdAt: Date }) => bookmarkSchema.parse({ id: row.id, worshipId: row.worshipId, createdAt: row.createdAt.toISOString(), worship: await publishedWorship(row.worshipId) });
  return {
    async list(input: unknown) {
      const query = bookmarkListSchema.parse(input);
      const groups: Record<string, WorshipContentType[]> = { devotional: ['FIRST_HOUR'], sermon: ['SUNDAY_MORNING', 'SUNDAY_AFTERNOON', 'WEDNESDAY'], other: ['SPECIAL', 'PRAISE'] };
      const rows = await db.memberBookmark.findMany({ where: { ownerId, worshipId: query.worshipId, ...(query.group === 'all' ? {} : { type: { in: groups[query.group] } }) }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: query.page * 20, take: 21 });
      return { data: await Promise.all(rows.slice(0, 20).map(dto)), nextPage: rows.length > 20 ? query.page + 1 : null };
    },
    async detail(id: string) { const row = await db.memberBookmark.findFirst({ where: { id, ownerId } }); if (!row) throw new MemberRecordNotFound(); return dto(row); },
    async create(input: unknown) {
      const { worshipId } = bookmarkInputSchema.parse(input); const worship = await publishedWorship(worshipId); if (!worship) throw new MemberRecordNotFound();
      const row = await db.memberBookmark.upsert({ where: { ownerId_worshipId: { ownerId, worshipId } }, create: { ownerId, worshipId, type: worship.type }, update: { type: worship.type } });
      return bookmarkSchema.parse({ id: row.id, worshipId, createdAt: row.createdAt.toISOString(), worship });
    },
    async remove(id: string, input: unknown) { z.object({}).strict().parse(input); await db.memberBookmark.deleteMany({ where: { id, ownerId } }); },
  };
}
