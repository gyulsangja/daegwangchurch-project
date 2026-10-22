import { z } from 'zod';
const code = z.object({ code: z.string().trim().min(1).max(80), label: z.string().trim().min(1).max(60) }).strict();
export const yearNumber = z.number().int().min(2000).max(2200);
export const yearCreateSchema = z.object({ year: yearNumber, sourceYear: yearNumber, sourceVersion: z.number().int().positive(), copyMembers: z.boolean(), copyRoles: z.boolean() }).strict();
export const yearConfigSchema = z.object({
  version: z.number().int().positive(), name: z.string().trim().min(1).max(80),
  positions: z.array(code).max(60), statuses: z.array(code).min(1).max(30),
  organizationTypes: z.array(code).min(1).max(40), roles: z.array(code).max(40),
  courses: z.array(code).max(80).default([]),
  organizations: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().trim().min(1).max(80), parentId: z.string().max(100).nullable(), type: z.string().min(1).max(80), roleCodes: z.array(z.string().min(1).max(80)).max(40).optional() }).strict()).max(150),
}).strict();
export const yearAssignmentSchema = z.object({
  version: z.number().int().positive(), memberId: z.string().min(1).max(100),
  position: z.string().max(80),
  affiliations: z.array(z.object({ organizationId: z.string().min(1).max(100), role: z.string().max(80) }).strict()).max(30),
}).strict();
export const yearActivateSchema = z.object({ version: z.number().int().positive(), activeVersion: z.number().int().positive(), confirmed: z.literal(true) }).strict();
export const organizationRosterSchema = z.object({version:z.number().int().positive(), organizationId:z.string().min(1).max(100), members:z.array(z.object({memberId:z.string().min(1).max(100),role:z.string().max(80)}).strict()).max(500)}).strict();
export function organizationRoleCodes(org: {type:string;roleCodes?:string[]}) {
  return org.roleCodes ?? ({FELLOWSHIP:['LEADER','SECRETARY','TREASURER'],SCHOOL:['DIRECTOR','TEACHER','STUDENT'],SERVICE:['DIRECTOR','VOLUNTEER'],SMALL_GROUP:['DIRECTOR'],DEPARTMENT:['DIRECTOR','SECRETARY','TREASURER']}[org.type] ?? []);
}
