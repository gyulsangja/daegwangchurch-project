import { z } from 'zod';
export const memberInputSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해 주세요.').max(60),
  status: z.string().min(1).max(40),
  position: z.string().max(40).default(''),
  phone: z.string().trim().max(25).regex(/^[\d+()\s-]*$/, '연락처 형식을 확인해 주세요.').default(''),
  address: z.string().trim().max(240).default(''),
  organizationIds: z.array(z.string().max(100)).max(30).default([]),
}).strict();
export const memberUpdateSchema = memberInputSchema.extend({ version: z.number().int().positive() }).strict();
export const memberSearchSchema = z.object({ q: z.string().trim().max(80).default(''), status: z.string().max(40).default(''), organizationId: z.string().max(100).default(''), page: z.coerce.number().int().min(1).max(10000).default(1) });
export type MemberInput = z.infer<typeof memberInputSchema>;
export type MemberSearch = z.infer<typeof memberSearchSchema>;
