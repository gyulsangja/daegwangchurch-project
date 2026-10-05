import type { PrismaClient } from '@daegwang/database/generated/client';
import { bulletinSchema, bulletinSummarySchema } from '@daegwang/contracts/features/bulletins/app-contract';
import { publicAttachmentUrl } from '../notices/app-query-core';

export function bulletinVisibility(now: Date) {
  return { status: 'PUBLISHED' as const, deletedAt: null, OR: [{ publishedAt: null }, { publishedAt: { lte: now } }], pdfMedia: { visibility: 'PUBLIC' as const, deletedAt: null, mimeType: 'application/pdf' } };
}
const select = { id: true, title: true, worshipDate: true, summary: true } as const;
const summary = (row: { id: string; title: string; worshipDate: Date; summary: string | null }) => bulletinSummarySchema.parse({ ...row, worshipDate: row.worshipDate.toISOString() });
export function createAppBulletinQueries(database: Pick<PrismaClient, 'bulletin'>, storageUrl?: string, now = () => new Date()) {
  return {
    async list(page: number, month?: string) {
      // CMS date-only inputs are stored at UTC midnight.
      const start = month ? new Date(`${month}-01T00:00:00.000Z`) : undefined;
      const end = start ? new Date(start) : undefined;
      if (end) end.setUTCMonth(end.getUTCMonth() + 1);
      const rows = await database.bulletin.findMany({ where: { ...bulletinVisibility(now()), ...(start ? { worshipDate: { gte: start, lt: end } } : {}) }, select,
        orderBy: [{ worshipDate: 'desc' }, { id: 'desc' }], skip: page * 20, take: 21 });
      return { data: rows.slice(0, 20).map(summary), nextPage: rows.length > 20 ? page + 1 : null };
    },
    async detail(id: string) {
      const row = await database.bulletin.findFirst({ where: { ...bulletinVisibility(now()), id }, select: { ...select,
        pdfMedia: { select: { originalName: true, sizeBytes: true, bucket: true, objectPath: true } } } });
      return row ? bulletinSchema.parse({ ...summary(row), pdf: { name: row.pdfMedia.originalName, sizeBytes: row.pdfMedia.sizeBytes,
        url: publicAttachmentUrl(storageUrl, row.pdfMedia.bucket, row.pdfMedia.objectPath) } }) : null;
    },
  };
}
