import type { Prisma } from '@daegwang/database/generated/client';
export function publishedEventWhere(now = new Date()): Prisma.EventWhereInput {
  return { status: 'PUBLISHED', deletedAt: null, AND: [{ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] }] };
}
