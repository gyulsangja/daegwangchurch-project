import {z} from 'zod';
export const groupIdSchema=z.string().regex(/^[a-z0-9-]{1,80}$/);
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const groupNoticeInputSchema=z.object({groupId:groupIdSchema,title:z.string().trim().min(1).max(200),body:z.string().trim().min(1).max(20000),audience:z.enum(['PUBLIC','MEMBERS']),status:z.enum(['DRAFT','PUBLISHED','PRIVATE'])}).strict();
export const groupInputSchema=z.object({id:groupIdSchema,name:z.string().trim().min(1).max(80),description:z.string().trim().max(1000),isActive:z.boolean(),version:z.number().int().positive().optional()}).strict();
export const groupMemberChanges=z.array(z.object({ownerId:z.uuid(),expectedMember:z.boolean(),approved:z.boolean()}).strict()).min(1).max(100).refine(rows=>new Set(rows.map(r=>r.ownerId)).size===rows.length);
export const groupManagementQuery=z.object({view:z.enum(['GROUPS','NOTICES','NOTICE_DETAIL','MEMBERS','MANAGERS']).default('GROUPS'),groupId:groupIdSchema.optional(),id:id.optional(),page:z.coerce.number().int().min(0).max(10000).default(0)}).strict().refine(v=>!['MEMBERS','MANAGERS','NOTICE_DETAIL'].includes(v.view)||!!v.groupId).refine(v=>v.view!=='NOTICE_DETAIL'||!!v.id);
export const groupManagementCommand=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('SAVE_GROUP'),data:groupInputSchema}).strict(),
 z.object({operation:z.literal('SAVE_NOTICE'),id,version:z.number().int().positive().nullable(),data:groupNoticeInputSchema,publishConfirmed:z.boolean().default(false)}).strict().refine(v=>v.data.status!=='PUBLISHED'||v.publishConfirmed,'게시와 기존 푸시 정책 적용을 확인해 주세요.'),
 z.object({operation:z.literal('MEMBERS'),groupId:groupIdSchema,changes:groupMemberChanges,confirmed:z.literal(true)}).strict(),
 z.object({operation:z.literal('MANAGER'),groupId:groupIdSchema,adminId:id,assigned:z.boolean(),expectedAssigned:z.boolean(),confirmed:z.literal(true)}).strict(),
 z.object({operation:z.literal('DELETE_NOTICE'),groupId:groupIdSchema,id,version:z.number().int().positive(),confirmed:z.literal(true)}).strict(),
]);
export const managedGroup=z.object({id:groupIdSchema,name:z.string(),description:z.string(),isActive:z.boolean(),version:z.number().int(),memberCount:z.number().int()});
export const managedGroupPage=z.object({groups:z.array(managedGroup),nextPage:z.number().int().nullable(),superAdmin:z.boolean(),enabled:z.boolean()});
export const managedGroupNotice=z.object({id,groupId:groupIdSchema,title:z.string(),audience:z.enum(['PUBLIC','MEMBERS']),status:z.enum(['DRAFT','PUBLISHED','PRIVATE']),version:z.number().int(),updatedAt:z.iso.datetime()});
export const managedNoticePage=z.object({data:z.array(managedGroupNotice),nextPage:z.number().int().nullable()});
export const managedNoticeDetail=z.object({notice:managedGroupNotice.extend({body:z.string()})});
export const managedGroupMembers=z.object({members:z.array(z.object({ownerId:z.uuid(),name:z.string(),approved:z.boolean(),eligible:z.boolean()})),limited:z.boolean()});
export const managedGroupManagers=z.object({admins:z.array(z.object({id:z.string(),name:z.string(),assigned:z.boolean()}))});
