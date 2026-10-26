import {z} from 'zod';
export const accessFields=z.object({name:z.string().trim().min(1).max(80),role:z.enum(['ADMIN','OFFICE','LEADER']),care:z.boolean(),print:z.boolean(),delete:z.boolean(),organizations:z.array(z.string().min(1).max(100)).max(100),year:z.number().int().min(1900).max(2200).nullable(),reason:z.string().trim().min(1).max(300)});
export const accessChange=z.discriminatedUnion('action',[
 accessFields.extend({action:z.literal('UPDATE'),id:z.uuid(),version:z.number().int().positive(),active:z.boolean()}).strict(),
 accessFields.extend({action:z.literal('INVITE'),email:z.email().max(254)}).strict(),
 z.object({action:z.enum(['CANCEL','REISSUE']),id:z.uuid(),version:z.number().int().positive(),reason:z.string().trim().min(1).max(300)}).strict(),
]);
export type AccessFields=z.infer<typeof accessFields>;
export type AccessUser=Omit<AccessFields,'reason'> & {id:string;email:string;active:boolean;version:number};
export type AccessInvitation=Omit<AccessUser,'active'> & {status:'PENDING'|'EXPIRED'|'CANCELLED'|'ACCEPTED';expiresAt:string};
export type AccessSnapshot={users:AccessUser[];invitations:AccessInvitation[];events:{actor_id:string;subject:string;action:string;reason:string;at:string;before_value:unknown;after_value:unknown}[]};
