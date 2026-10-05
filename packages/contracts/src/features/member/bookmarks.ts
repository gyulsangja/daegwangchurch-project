import { z } from 'zod';
import { appWorshipSchema } from '../worship/app-contract';
export const bookmarkInputSchema = z.object({ worshipId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }).strict();
export const bookmarkListSchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), group: z.enum(['all', 'devotional', 'sermon', 'other']).default('all'), worshipId: bookmarkInputSchema.shape.worshipId.optional() }).strict();
export const bookmarkSchema = z.object({ id: z.string(), worshipId: z.string(), createdAt: z.iso.datetime(), worship: appWorshipSchema.nullable() });
export const bookmarkPageSchema = z.object({ data: z.array(bookmarkSchema), nextPage: z.number().int().nonnegative().nullable() });
export type Bookmark = z.infer<typeof bookmarkSchema>;
