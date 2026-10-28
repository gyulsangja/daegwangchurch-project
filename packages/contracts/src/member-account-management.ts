import {z} from 'zod';
import {churchStatusSchema} from './features/member/church-membership';
const ownerId=z.uuid();const groups=z.array(z.string().min(1).max(80)).max(30);
export const memberAccountQuery=z.object({q:z.string().trim().max(100).default(''),status:z.enum(['ALL','PENDING','CONFIRMED','ADMIN','DELETING']).default('ALL'),page:z.coerce.number().int().min(1).max(10000).default(1)}).strict();
export const memberAccountCommand=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('REVIEW'),ownerId,version:z.number().int().positive(),status:z.enum(['CONFIRMED','UNCONFIRMED']),groupIds:groups}).strict(),
 z.object({operation:z.literal('DETAILS'),ownerId,version:z.number().int().nonnegative(),position:z.string().trim().min(1).max(40),groupIds:groups}).strict(),
 z.object({operation:z.literal('ROLE'),ownerId,role:z.enum(['MEMBER','ADMIN','SUPER_ADMIN']),confirmed:z.literal(true)}).strict(),
 z.object({operation:z.literal('DELETE'),ownerId,email:z.email(),confirm:z.literal('DELETE')}).strict(),
]);
export const memberAccountRow=z.object({id:ownerId,email:z.string(),name:z.string(),createdAt:z.iso.datetime(),lastSignInAt:z.iso.datetime().nullable(),status:churchStatusSchema,phone:z.string(),position:z.string(),version:z.number().int().nullable(),adminId:z.string().nullable(),role:z.string().nullable(),activeAdmin:z.boolean().nullable(),deletionStatus:z.string().nullable(),groupIds:groups});
export const memberAccountPage=z.object({rows:z.array(memberAccountRow),total:z.number().int().nonnegative(),page:z.number().int().positive(),pageCount:z.number().int().positive(),q:z.string(),status:z.string(),groups:z.array(z.object({id:z.string(),name:z.string()})),actorId:ownerId,deletionReady:z.boolean(),membershipEnabled:z.boolean()});
export type MemberAccountRow=z.infer<typeof memberAccountRow>;
