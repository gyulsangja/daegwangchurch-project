import {z} from 'zod';
import {groupIdSchema,groupMemberChanges} from './group-management';
export const organizationSyncQuery=z.object({groupId:groupIdSchema}).strict();
export const organizationSyncCommand=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('MAP'),groupId:groupIdSchema,year:z.number().int(),version:z.number().int().positive(),organizationIds:z.array(z.string().min(1).max(100)).max(150),confirmed:z.literal(true)}).strict(),
 z.object({operation:z.literal('APPLY'),groupId:groupIdSchema,year:z.number().int(),version:z.number().int().positive(),changes:groupMemberChanges,confirmed:z.literal(true)}).strict(),
]);
export const organizationSyncPreview=z.object({year:z.number().int(),version:z.number().int(),organizations:z.array(z.object({id:z.string(),name:z.string(),appGroupId:z.string().optional()})),changes:z.array(z.object({ownerId:z.uuid(),name:z.string(),expectedMember:z.boolean(),approved:z.boolean()})),unlinked:z.number().int(),ineligible:z.number().int(),limited:z.boolean()});
