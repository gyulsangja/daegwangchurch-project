import { z } from "zod";

export const worshipTypeSchema = z.enum(["FIRST_HOUR", "SUNDAY_MORNING", "SUNDAY_AFTERNOON", "WEDNESDAY", "SPECIAL", "PRAISE"]);
export const appWorshipSnapshotSchema = z.object({
  type: worshipTypeSchema,
  title: z.string().min(1),
  contentDate: z.iso.date(),
  youtube: z.object({ videoId: z.string().regex(/^[\w-]{11}$/), url: z.url(), thumbnailUrl: z.url().nullable() }),
  preacher: z.string().nullable(),
  sermonTitle: z.string().nullable(),
  scriptureReference: z.string().nullable(),
  description: z.string().nullable(),
  summary: z.string().nullable(),
});
export type AppWorshipSnapshot = z.infer<typeof appWorshipSnapshotSchema>;
export const appWorshipSchema = appWorshipSnapshotSchema.extend({ id: z.string().min(1), version: z.number().int().positive() });
export type AppWorship = z.infer<typeof appWorshipSchema>;
export const appWorshipPageSchema = z.object({ data: z.array(appWorshipSchema), nextCursor: z.string().nullable() });

export const appWorshipListSchema = z.object({
  type: worshipTypeSchema.optional(),
  month: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(512).optional(),
}).strict();
