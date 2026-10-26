import {z} from 'zod';
import {recordDate} from './ministry-records';
export const pastoralInput = z.object({
  kind:z.enum(['CARE','PRAYER','GOAL','PLAN']), title:z.string().trim().min(1).max(120),
  body:z.string().trim().max(4000), date:recordDate, memberId:z.string().max(100).default(''),
  goalId:z.string().max(100).default(''), category:z.enum(['COUNSEL','VISIT','OTHER']).default('OTHER'),
  status:z.enum(['OPEN','DONE','ARCHIVED']).default('OPEN'),
  scope:z.enum(['ONCE','YEAR','MONTH','ONGOING','SPECIAL']).optional(),
  period:z.string().max(7).optional(),
  memberIds:z.array(z.string().min(1).max(100)).max(200).optional(),
  familyIds:z.array(z.string().min(1).max(100)).max(100).optional(),
  organizationIds:z.array(z.string().min(1).max(100)).max(100).optional(),
  organizationYear:z.number().int().min(1900).max(2200).optional(),
}).strict();
export const pastoralChange=pastoralInput.extend({id:z.string().min(1),version:z.number().int().positive(),reflection:z.string().trim().max(2000).default(''),reflectionDate:recordDate.optional(),refreshTargets:z.boolean().optional()}).strict();
export const pastoralCreate=pastoralInput.extend({reflection:z.string().trim().max(2000).default(''),reflectionDate:recordDate.optional()}).strict();
export type PastoralInput=z.infer<typeof pastoralInput>;
export const attendanceQuery=z.object({date:recordDate,event:z.string().trim().min(1).max(100),organizationId:z.string().max(100).default('')}).strict();
export const attendanceBatch=attendanceQuery.extend({revision:z.number().int().nonnegative(),reason:z.string().trim().max(300).default(''),rows:z.array(z.object({memberId:z.string().min(1),value:z.enum(['PRESENT','ONLINE','ABSENT','EXCUSED','UNKNOWN'])}).strict()).max(1000)}).strict();
