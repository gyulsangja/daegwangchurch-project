import { z } from 'zod';
export const bulletinSummarySchema = z.object({ id: z.string().min(1), title: z.string(), worshipDate: z.iso.datetime(), summary: z.string().nullable() });
export const bulletinSchema = bulletinSummarySchema.extend({ pdf: z.object({ name: z.string(), sizeBytes: z.number().int().nonnegative(), url: z.url().refine(value => { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }) }) });
export const bulletinPageSchema = z.object({ data: z.array(bulletinSummarySchema), nextPage: z.number().int().nonnegative().nullable() });
export const bulletinListQuerySchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), month: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/).optional() }).strict();
export type Bulletin = z.infer<typeof bulletinSchema>;
export type BulletinPage = z.infer<typeof bulletinPageSchema>;
