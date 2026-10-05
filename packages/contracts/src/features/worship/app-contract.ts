import { z } from "zod";

export const worshipTypeSchema = z.enum(["FIRST_HOUR", "SUNDAY_MORNING", "SUNDAY_AFTERNOON", "WEDNESDAY", "SPECIAL", "PRAISE"]);
export const worshipTypeLabels = { FIRST_HOUR: '첫시간 주님께', SUNDAY_MORNING: '주일 오전예배', SUNDAY_AFTERNOON: '주일 오후예배', WEDNESDAY: '수요기도회', SPECIAL: '특별예배', PRAISE: '찬양' } as const;
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
  group: z.enum(['sermon', 'sunday', 'special']).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  preacher: z.string().trim().min(1).max(100).optional(),
  scripture: z.string().trim().min(1).max(100).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  month: z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(512).optional(),
}).strict().refine(value => !value.from || !value.to || value.from <= value.to, { message: '시작일과 종료일을 확인해 주세요.' });
