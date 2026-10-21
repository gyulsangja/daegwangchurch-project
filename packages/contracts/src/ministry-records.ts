import { z } from 'zod';
export const recordDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const date = new Date(`${value}T00:00:00Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10) === value; });
const base = { date: recordDate, note: z.string().trim().max(2000).default('') };
export const ministryRecordSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('POSITION'), value: z.string().min(1).max(80) }).strict(),
  z.object({ ...base, kind: z.literal('STATUS'), value: z.string().min(1).max(80) }).strict(),
  z.object({ ...base, kind: z.literal('SETTLEMENT'), value: z.enum(['NEW', 'LEARNING', 'SETTLED']) }).strict(),
  z.object({ ...base, kind: z.literal('SERVICE'), organizationId: z.string().min(1), role: z.string().max(80), endDate: recordDate.nullable() }).strict(),
  z.object({ ...base, kind: z.literal('ATTENDANCE'), organizationId: z.string(), event: z.string().trim().min(1).max(100), value: z.enum(['PRESENT', 'ABSENT', 'EXCUSED', 'ONLINE']) }).strict(),
  z.object({ ...base, kind: z.literal('CARE'), category: z.enum(['COUNSEL', 'VISIT']), content: z.string().trim().min(1).max(5000), nextDate: recordDate.nullable() }).strict(),
]);
export type MinistryRecordInput = z.infer<typeof ministryRecordSchema>;
