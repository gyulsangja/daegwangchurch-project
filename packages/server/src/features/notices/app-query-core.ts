import type { PrismaClient } from '@daegwang/database/generated/client';
import { noticeSchema, noticeSummarySchema } from '@daegwang/contracts/features/notices/app-contract';
import { publishedNoticeWhere } from './public-policy';

const publicMedia = { visibility: 'PUBLIC' as const, deletedAt: null };
const select = {
  id: true, title: true, category: true, isPinned: true, isImportant: true,
  publishedAt: true, createdAt: true, updatedAt: true,
  _count: { select: { attachments: { where: { media: publicMedia } } } },
} as const;
type SummaryRow = { id: string; title: string; category: string; isPinned: boolean; isImportant: boolean;
  publishedAt: Date | null; createdAt: Date; updatedAt: Date; _count: { attachments: number } };
const summary = (row: SummaryRow) => noticeSummarySchema.parse({ ...row,
  publishedAt: (row.publishedAt ?? row.createdAt).toISOString(), updatedAt: row.updatedAt.toISOString(), attachmentCount: row._count.attachments,
});

export function publicAttachmentUrl(base: string | undefined, bucket: string, path: string) {
  if (!base) throw new Error('Storage is not configured');
  const url = new URL(base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid storage origin');
  const segments = [bucket, ...path.split('/')];
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) throw new Error('Invalid storage path');
  return `${url.origin}/storage/v1/object/public/${segments.map(encodeURIComponent).join('/')}`;
}

export function createAppNoticeQueries(database: Pick<PrismaClient, 'notice'>, storageUrl?: string, now = () => new Date(), category?: string) {
  const where = () => ({ ...publishedNoticeWhere(now()), ...(category ? { category } : {}) });
  return {
    async list(page: number) {
      const rows = await database.notice.findMany({ where: where(), select,
        orderBy: [{ isPinned: 'desc' }, { isImportant: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: page * 20, take: 21 });
      return { data: rows.slice(0, 20).map(summary), nextPage: rows.length > 20 ? page + 1 : null };
    },
    async detail(id: string) {
      const row = await database.notice.findFirst({ where: { ...where(), id }, select: { ...select, content: true,
        attachments: { where: { media: publicMedia }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: { media: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, bucket: true, objectPath: true } } } },
      } });
      if (!row) return null;
      const content = row.content;
      const body = typeof content === 'string' ? content : content && typeof content === 'object' && !Array.isArray(content) && typeof content.body === 'string' ? content.body : '';
      return noticeSchema.parse({ ...summary(row), body, attachments: row.attachments.map(({ media }) => ({
        id: media.id, name: media.originalName, mimeType: media.mimeType, sizeBytes: media.sizeBytes,
        url: publicAttachmentUrl(storageUrl, media.bucket, media.objectPath),
      })) });
    },
  };
}
