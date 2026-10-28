import {z} from 'zod';
import {bulletinFormSchema} from './features/bulletins/schema';
import {worshipResources} from './worship-sessions';
import {worshipFormSchema} from './features/worship/schema';
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const page=z.coerce.number().int().min(0).max(10000).default(0);
export const worshipManagementQuery=z.object({month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),page,kind:z.enum(['BULLETIN','WORSHIP','ALL','HISTORY','RESOURCES','VIDEO_DETAIL']).default('BULLETIN'),bulletinPage:page,worshipPage:page,id:id.optional(),refs:z.string().max(10000).optional()}).strict().refine(v=>!['HISTORY','VIDEO_DETAIL'].includes(v.kind)||!!v.id,'주보를 선택해 주세요.');
export function parseWorshipResourceRefs(value:string|undefined){let parsed:unknown;try{parsed=JSON.parse(value??'[]');}catch{parsed=null;}return worshipResources.parse(parsed);}
export const bulletinManagementSave=bulletinFormSchema.extend({id,expectedUpdatedAt:z.iso.datetime(),worshipContentId:id.nullable(),publishConfirmed:z.boolean().default(false)}).strict().superRefine((v,c)=>{if(v.status==='PUBLISHED'&&!v.publishConfirmed)c.addIssue({code:'custom',message:'홈페이지·앱 공개를 확인해 주세요.'});});
export const worshipManagementRow=z.object({id,kind:z.enum(['BULLETIN','WORSHIP']),title:z.string(),date:z.iso.date(),status:z.enum(['DRAFT','PUBLISHED','PRIVATE']),updatedAt:z.iso.datetime(),summary:z.string(),worshipContentId:z.string().nullable(),linkedTitle:z.string().nullable(),type:z.string(),preacher:z.string(),scripture:z.string(),videoId:z.string().nullable()});
export const worshipManagementPage=z.object({data:z.array(worshipManagementRow),nextPage:z.number().int().nullable()});
export const worshipManagementBundle=z.object({BULLETIN:worshipManagementPage,WORSHIP:worshipManagementPage});
export const bulletinFileHistory=z.object({files:z.array(z.object({id:z.string(),name:z.string(),url:z.url(),capturedAt:z.iso.datetime(),isCurrent:z.boolean()})),nextPage:z.number().int().nullable()});
export const restoreBulletinFile=z.object({operation:z.literal('RESTORE_FILE'),id,versionId:id,expectedUpdatedAt:z.iso.datetime(),publishConfirmed:z.boolean().default(false)}).strict();
export const videoManagementSave=worshipFormSchema.omit({sermonTitle:true}).extend({operation:z.literal('SAVE_VIDEO'),id,expectedUpdatedAt:z.iso.datetime().nullable(),publishConfirmed:z.boolean().default(false)}).strict().superRefine((v,c)=>{if(v.status==='PUBLISHED'&&!v.publishConfirmed)c.addIssue({code:'custom',message:'홈페이지·앱 공개와 기존 알림 정책 적용을 확인해 주세요.'});});
export const videoManagementDetail=z.object({video:z.object({id,expectedUpdatedAt:z.iso.datetime(),type:worshipFormSchema.shape.type,title:z.string(),contentDate:z.iso.date(),youtubeUrl:z.string(),preacher:z.string(),scripture:z.string(),description:z.string(),summary:z.string(),status:worshipFormSchema.shape.status,isPinned:z.boolean()})});
export const deleteWorshipSource=z.object({operation:z.literal('DELETE_SOURCE'),kind:z.enum(['BULLETIN','WORSHIP']),id,expectedUpdatedAt:z.iso.datetime(),confirmed:z.literal(true)}).strict();
export const worshipManagementSave=z.union([deleteWorshipSource,videoManagementSave,restoreBulletinFile,bulletinManagementSave]);
export const worshipManagementResult=z.union([worshipManagementBundle,worshipManagementPage,bulletinFileHistory,videoManagementDetail]);
export type WorshipManagementRow=z.infer<typeof worshipManagementRow>;
export function worshipMonthRange(month:string){
 const checked=worshipManagementQuery.parse({month}).month;
 const [year,m]=checked.split('-').map(Number);
 return {gte:new Date(`${checked}-01T00:00:00.000Z`),lt:new Date(`${m===12?year+1:year}-${String(m===12?1:m+1).padStart(2,'0')}-01T00:00:00.000Z`)};
}
