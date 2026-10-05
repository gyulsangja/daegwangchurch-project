import { z } from 'zod';

export const noticeSummarySchema = z.object({
  id: z.string().min(1), title: z.string(), category: z.string(),
  isPinned: z.boolean(), isImportant: z.boolean(),
  publishedAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
  attachmentCount: z.number().int().nonnegative(),
});
export const noticeSchema = noticeSummarySchema.extend({
  body: z.string(),
  attachments: z.array(z.object({
    id: z.string(), name: z.string(), mimeType: z.string(), sizeBytes: z.number().int().nonnegative(),
    url: z.url().refine(value => { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }),
  })),
});
export const noticePageSchema = z.object({ data: z.array(noticeSummarySchema), nextPage: z.number().int().nonnegative().nullable() });
export const noticeListQuerySchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0) }).strict();
export type Notice = z.infer<typeof noticeSchema>;
export type NoticePage = z.infer<typeof noticePageSchema>;
