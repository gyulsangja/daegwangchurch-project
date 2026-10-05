import { z } from 'zod';

export const emailSchema = z.email().trim().max(254);
// Development validation baseline, not the final church password policy.
export const passwordSchema = z.string().min(8).max(128);
export const signupSchema = z.object({ email: emailSchema, password: passwordSchema, confirm: z.string(), displayName: z.string().trim().max(40), policyVersion: z.string().min(1), consent: z.literal(true) }).strict().refine(input => input.password === input.confirm, { path: ['confirm'], message: '비밀번호가 일치하지 않습니다.' });
export const resetPasswordSchema = z.object({ email: emailSchema, code: z.string().regex(/^\d{6,8}$/), password: passwordSchema, confirm: z.string() }).strict().refine(input => input.password === input.confirm, { path: ['confirm'], message: '비밀번호가 일치하지 않습니다.' });
export const memberOptionsSchema = z.object({ mode: z.enum(['unavailable', 'preview', 'configured']), registration: z.boolean(), recovery: z.boolean(), care: z.boolean(), notifications: z.boolean(), deletion: z.boolean(), carePolicyVersion: z.string().nullable().optional(), deletionPolicyVersion: z.string().nullable().optional(), policy: z.object({ version: z.string(), terms: z.string(), privacy: z.string(), care: z.string(), deletion: z.string() }).nullable() });
export const unavailableMemberOptions = { mode: 'unavailable' as const, registration: false, recovery: false, care: false, notifications: false, deletion: false, policy: null };
export type MemberOptions = z.infer<typeof memberOptionsSchema>;

const common = { name: z.string().trim().min(1).max(80), phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,30}$/), preferredTime: z.string().trim().max(200), message: z.string().trim().max(4000) };
export const careInputSchema = z.discriminatedUnion('kind', [
  z.object({ ...common, kind: z.literal('COUNSELING'), method: z.enum(['PHONE', 'IN_PERSON', 'DISCUSS']) }).strict(),
  z.object({ ...common, kind: z.literal('VISIT'), place: z.enum(['HOME', 'CHURCH', 'OTHER', 'DISCUSS']), location: z.string().trim().max(300) }).strict(),
]);
export const careCreateSchema = z.object({ content: careInputSchema, consent: z.literal(true), policyVersion: z.string().min(1), requestKey: z.uuid() }).strict();
export const careStatusSchema = z.enum(['RECEIVED', 'DISCUSSING', 'SCHEDULED', 'COMPLETED', 'CANCELLED']);
export const careStatusLabels = { RECEIVED: '접수됨 · 예약 미확정', DISCUSSING: '일정 협의중', SCHEDULED: '일정 확정', COMPLETED: '완료', CANCELLED: '취소됨' };
export const careSchema = z.object({ id: z.string(), content: careInputSchema, status: careStatusSchema, version: z.number().int().positive(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });
export const carePageSchema = z.object({ data: z.array(careSchema), nextPage: z.number().int().nonnegative().nullable() });
export type CareInput = z.infer<typeof careInputSchema>;
export type CareRequest = z.infer<typeof careSchema>;

export const notificationCategorySchema = z.enum(['WORD', 'NEWS', 'SCHEDULE']);
export const notificationTargetSchema = z.object({ kind: z.enum(['devotional', 'sermons', 'notices', 'events', 'schedules']), id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }).nullable();
export const notificationSchema = z.object({ id: z.string(), category: notificationCategorySchema, title: z.string(), body: z.string(), createdAt: z.iso.datetime(), readAt: z.iso.datetime().nullable(), target: notificationTargetSchema });
export const notificationPageSchema = z.object({ data: z.array(notificationSchema), nextPage: z.number().int().nonnegative().nullable() });
export type MemberNotification = z.infer<typeof notificationSchema>;
export const preferenceInputSchema = z.object({ devotional: z.boolean(), worship: z.boolean(), notices: z.boolean(), events: z.boolean(), schedules: z.boolean(), devotionalTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), timeZone: z.literal('Asia/Seoul') }).strict();
export const preferenceSchema = preferenceInputSchema.extend({ version: z.number().int().positive() });
export const defaultPreferences = { devotional: false, worship: false, notices: false, events: false, schedules: false, devotionalTime: '06:30', timeZone: 'Asia/Seoul' as const, version: 1 };
export const profileSchema = z.object({ email: emailSchema, displayName: z.string().max(40), consentVersion: z.string().nullable(), version: z.number().int().positive() });
export type NotificationPreferences = z.infer<typeof preferenceSchema>;
