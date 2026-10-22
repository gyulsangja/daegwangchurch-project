import { z } from 'zod';
export const familyInputSchema = z.object({
  name:z.string().trim().min(1).max(80),
  representativeId:z.string().min(1).nullable(),
  members:z.array(z.object({memberId:z.string().min(1),relationship:z.enum(['가구원','기준 교인','배우자','자녀','부모','형제자매','조부모','손자녀','기타'])}).strict()).min(1).max(40),
}).strict();
export const familyUpdateSchema=familyInputSchema.extend({version:z.number().int().positive()}).strict();
export const familyArchiveSchema=z.object({version:z.number().int().positive(),confirmed:z.literal(true)}).strict();
