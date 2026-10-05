import { z } from 'zod';
import { monthSchema } from '../calendar';
import { eventSummarySchema } from '../events/app-contract';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const personalScheduleSchema = z.object({ kind: z.literal('PERSONAL'), title: z.string().trim().min(1).max(200), startDate: z.iso.date(), endDate: z.iso.date(), allDay: z.boolean(), startTime: time.nullable(), endTime: time.nullable(), location: z.string().trim().max(300).default(''), note: z.string().trim().max(10000).default('') }).strict().refine(value => value.endDate >= value.startDate && (value.allDay || (!!value.startTime && !!value.endTime && `${value.endDate}T${value.endTime}` > `${value.startDate}T${value.startTime}`)), { message: '종료 일시는 시작 일시보다 늦어야 합니다.' });
export const savedEventInputSchema = z.object({ kind: z.literal('CHURCH'), eventId: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }).strict();
export const memberScheduleInputSchema = z.union([personalScheduleSchema, savedEventInputSchema]);
export const memberScheduleListSchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), date: z.iso.date().optional(), month: monthSchema.optional(), group: z.enum(['all', 'personal', 'saved']).default('all'), eventId: savedEventInputSchema.shape.eventId.optional() }).strict();
export const memberScheduleSchema = z.object({ id: z.string(), version: z.number().int().positive(), content: personalScheduleSchema.nullable(), eventId: z.string().nullable(), event: eventSummarySchema.nullable() });
export const memberSchedulePageSchema = z.object({ data: z.array(memberScheduleSchema), nextPage: z.number().int().nonnegative().nullable() });
export const memberScheduleUpdateSchema = z.object({ version: z.number().int().positive(), content: personalScheduleSchema }).strict();
export type PersonalSchedule = z.infer<typeof personalScheduleSchema>;
export type MemberSchedule = z.infer<typeof memberScheduleSchema>;
export function personalScheduleBounds(value: PersonalSchedule) {
  const startsAt = new Date(`${value.startDate}T${value.allDay ? '00:00' : value.startTime}:00+09:00`);
  const endsAt = new Date(new Date(`${value.endDate}T${value.allDay ? '00:00' : value.endTime}:00+09:00`).getTime() + (value.allDay ? 86400000 : 0));
  return { startsAt, endsAt };
}
