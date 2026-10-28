import {z} from 'zod';
import {careStatusSchema} from './features/member/extras';
import {inquiryStatusSchema,inquiryNoteSchema} from './features/inquiries/schema';
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const careAllowedTransitions:Record<string,string[]>={RECEIVED:['DISCUSSING','CANCELLED'],DISCUSSING:['SCHEDULED','COMPLETED','CANCELLED'],SCHEDULED:['DISCUSSING','COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
export const intakeQuery=z.object({kind:z.enum(['INQUIRY','CARE']),page:z.coerce.number().int().min(0).max(10000).default(0),id:id.optional(),status:z.string().max(30).default('')}).strict();
export const intakeRow=z.object({id,kind:z.enum(['INQUIRY','CARE']),name:z.string(),title:z.string(),type:z.string(),status:z.string(),createdAt:z.iso.datetime(),updatedAt:z.iso.datetime(),version:z.number().int().positive().nullable()});
export const intakePage=z.object({data:z.array(intakeRow),nextPage:z.number().int().nullable()});
export const intakeDetail=z.object({data:intakeRow.extend({phone:z.string(),email:z.string(),preferredContact:z.string(),content:z.string(),notes:z.array(z.object({id:z.string(),body:z.string(),author:z.string(),createdAt:z.iso.datetime()})),notesLimited:z.boolean()})});
export const intakeSave=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('INQUIRY'),id,expectedUpdatedAt:z.iso.datetime(),status:inquiryStatusSchema,note:inquiryNoteSchema.or(z.literal('')).default('')}).strict(),
 z.object({kind:z.literal('CARE'),id,version:z.number().int().positive(),status:careStatusSchema}).strict(),
]);
export type IntakeRow=z.infer<typeof intakeRow>;
