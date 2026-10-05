import type { Prisma } from '@daegwang/database/generated/client';

export function publishedNoticeWhere(now: Date): Prisma.NoticeWhereInput {
  return {
    status: 'PUBLISHED', deletedAt: null,
    AND: [
      { OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      { OR: [{ publishStartsAt: null }, { publishStartsAt: { lte: now } }] },
      { OR: [{ publishEndsAt: null }, { publishEndsAt: { gt: now } }] },
    ],
  };
}
