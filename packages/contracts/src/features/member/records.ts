import { z } from 'zod';
export const memberRecordKindSchema = z.enum(['REFLECTION', 'PRAYER', 'SPECIAL_PRAYER']);
const common = { title: z.string().trim().max(200).default(''), body: z.string().trim().min(1).max(20000), date: z.iso.date() };
const recordId = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const recordWorshipSchema = z.object({ id: recordId, version: z.number().int().positive(), title: z.string().max(300), contentDate: z.iso.date(), scriptureReference: z.string().max(500).nullable() }).strict();
export const memberRecordInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('REFLECTION'), ...common, worship: recordWorshipSchema }).strict(),
  z.object({ kind: z.literal('PRAYER'), ...common, reflectionId: recordId.nullable().default(null) }).strict(),
  z.object({ kind: z.literal('SPECIAL_PRAYER'), ...common, title: z.string().trim().min(1).max(200), body: z.string().trim().max(20000).default(''), date: z.iso.date().nullable().default(null), reflectionId: recordId.nullable().default(null), answeredOn: z.iso.date().nullable().default(null), gratitude: z.string().trim().max(20000).default('') }).strict(),
]).refine(value => value.kind !== 'SPECIAL_PRAYER' || !value.answeredOn || !value.date || value.answeredOn >= value.date, { message: '응답일은 시작일보다 빠를 수 없습니다.' });
export const memberRecordSchema = z.object({ id: z.string(), version: z.number().int().positive(), content: memberRecordInputSchema, createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const memberRecordUpdateSchema = z.object({ version: z.number().int().positive(), content: memberRecordInputSchema }).strict();
export type MemberRecordInput = z.infer<typeof memberRecordInputSchema>;
export type MemberRecord = z.infer<typeof memberRecordSchema>;
export const memberRecordPageSchema = z.object({ data: z.array(memberRecordSchema), nextPage: z.number().int().nonnegative().nullable() });
export const memberRecordListSchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), kind: memberRecordKindSchema.optional(), date: z.iso.date().optional(), worshipId: recordId.optional(), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(), reflectionId: recordId.optional() }).strict();
