import {z} from 'zod';
import {bulletinFormSchema} from './features/bulletins/schema';
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const page=z.coerce.number().int().min(0).max(10000).default(0);
export const worshipManagementQuery=z.object({month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),page,kind:z.enum(['BULLETIN','WORSHIP','ALL']).default('BULLETIN'),bulletinPage:page,worshipPage:page}).strict();
export const bulletinManagementSave=bulletinFormSchema.extend({id,expectedUpdatedAt:z.iso.datetime(),worshipContentId:id.nullable(),publishConfirmed:z.boolean().default(false)}).strict().superRefine((v,c)=>{if(v.status==='PUBLISHED'&&!v.publishConfirmed)c.addIssue({code:'custom',message:'홈페이지·앱 공개를 확인해 주세요.'});});
export const worshipManagementRow=z.object({id,kind:z.enum(['BULLETIN','WORSHIP']),title:z.string(),date:z.iso.date(),status:z.enum(['DRAFT','PUBLISHED','PRIVATE']),updatedAt:z.iso.datetime(),summary:z.string(),worshipContentId:z.string().nullable(),linkedTitle:z.string().nullable(),type:z.string(),preacher:z.string(),scripture:z.string(),videoId:z.string().nullable()});
export const worshipManagementPage=z.object({data:z.array(worshipManagementRow),nextPage:z.number().int().nullable()});
export const worshipManagementBundle=z.object({BULLETIN:worshipManagementPage,WORSHIP:worshipManagementPage});
export const worshipManagementResult=z.union([worshipManagementBundle,worshipManagementPage]);
export type WorshipManagementRow=z.infer<typeof worshipManagementRow>;
export function worshipMonthRange(month:string){
 const checked=worshipManagementQuery.parse({month}).month;
 const [year,m]=checked.split('-').map(Number);
 return {gte:new Date(`${checked}-01T00:00:00.000Z`),lt:new Date(`${m===12?year+1:year}-${String(m===12?1:m+1).padStart(2,'0')}-01T00:00:00.000Z`)};
}
