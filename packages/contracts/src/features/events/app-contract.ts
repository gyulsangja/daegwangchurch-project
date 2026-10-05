import { z } from 'zod';
import { monthSchema } from '../calendar';
export const eventSummarySchema = z.object({ id: z.string().min(1), title: z.string(), category: z.string(), startsAt: z.iso.datetime(), endsAt: z.iso.datetime().nullable(), isAllDay: z.boolean(), location: z.string().nullable(), ministryName: z.string().nullable() });
export const eventSchema = eventSummarySchema.extend({ description: z.string() });
export const eventPageSchema = z.object({ data: z.array(eventSummarySchema), nextPage: z.number().int().nonnegative().nullable() });
export const eventListQuerySchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), period: z.enum(['upcoming', 'past']).default('upcoming'), date: z.iso.date().optional(), month: monthSchema.optional() }).strict();
export type ChurchEvent = z.infer<typeof eventSchema>;
export type Event = ChurchEvent;
export type EventPage = z.infer<typeof eventPageSchema>;
