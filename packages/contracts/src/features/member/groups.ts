import { z } from 'zod';
export const groupSchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), name: z.string(), description: z.string() });
export const groupNoticeSchema = z.object({ id: z.string(), groupId: z.string(), title: z.string(), body: z.string(), audience: z.enum(['PUBLIC', 'MEMBERS']), publishedAt: z.iso.datetime() });
export const groupSnapshotSchema = z.object({ groups: z.array(groupSchema), interests: z.array(z.string()), memberships: z.array(z.string()), notifications: z.boolean(), version: z.number().int().positive(), notices: z.array(groupNoticeSchema) });
export const groupPreferenceSchema = z.object({ interests: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(50).refine(ids => new Set(ids).size === ids.length), notifications: z.boolean(), version: z.number().int().positive() }).strict();
// Interest subscriptions NEVER grant membership access. Use only server-verified IDs.
export function canReadGroupNotice(notice: { groupId: string; audience: 'PUBLIC' | 'MEMBERS' }, verifiedMemberships: readonly string[]) { return notice.audience === 'PUBLIC' || verifiedMemberships.includes(notice.groupId); }
export type GroupSnapshot = z.infer<typeof groupSnapshotSchema>;
