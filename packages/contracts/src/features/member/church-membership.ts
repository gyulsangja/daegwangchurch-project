import { z } from 'zod';
export const churchStatusSchema = z.enum(['UNCONFIRMED', 'PENDING', 'CONFIRMED']);
export const churchStatusLabels = { UNCONFIRMED: '일반 회원 · 교인 미확인', PENDING: '교인 확인 요청 중', CONFIRMED: '대광교회 교인' };
export const churchDetailsSchema = z.object({ realName: z.string().trim().min(1).max(40), phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,30}$/), position: z.string().trim().min(1).max(40) }).strict();
export type ChurchDetails = z.infer<typeof churchDetailsSchema>;
export const churchMembershipSchema = z.object({ status: churchStatusSchema, realName: z.string(), phone: z.string(), position: z.string(), groups: z.array(z.object({ id: z.string(), name: z.string() })), version: z.number().int().nonnegative() });
export const churchRequestSchema = churchDetailsSchema.extend({ version: z.number().int().nonnegative() }).strict();
export const churchReviewSchema = z.object({ ownerId: z.uuid(), version: z.number().int().positive(), status: z.enum(['UNCONFIRMED', 'CONFIRMED']), groupIds: z.array(z.string().min(1).max(80)).max(30).default([]) }).strict().refine(value => new Set(value.groupIds).size === value.groupIds.length && (value.status === 'CONFIRMED' || !value.groupIds.length));
