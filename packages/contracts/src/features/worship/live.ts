import { z } from 'zod';

export const liveBroadcastSchema = z.object({ videoId: z.string().regex(/^[\w-]{11}$/), title: z.string().min(1), channelTitle: z.string(), startedAt: z.iso.datetime({ offset: true }), embeddable: z.boolean() });
export const liveStatusSchema = z.object({ status: z.enum(['live', 'offline', 'unavailable', 'disabled']), broadcast: liveBroadcastSchema.nullable(), checkedAt: z.iso.datetime({ offset: true }) })
  .refine(value => (value.status === 'live') === (value.broadcast !== null));
export type LiveBroadcast = z.infer<typeof liveBroadcastSchema>;
export type LiveStatus = z.infer<typeof liveStatusSchema>;
