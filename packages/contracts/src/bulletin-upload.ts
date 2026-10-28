import {z} from 'zod';
import {bulletinFormSchema} from './features/bulletins/schema';
export const prepareBulletinPdf=z.object({operation:z.literal('PREPARE_PDF'),name:z.string().trim().min(1).max(200).refine(v=>v.toLowerCase().endsWith('.pdf'),'PDF 파일을 선택해 주세요.'),size:z.number().int().positive().max(10*1024*1024)}).strict();
export const bulletinPdfSave=bulletinFormSchema.extend({operation:z.literal('SAVE_PDF'),id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),expectedUpdatedAt:z.iso.datetime().nullable(),receipt:z.string().min(10).max(4000),publishConfirmed:z.boolean().default(false)}).strict().superRefine((v,c)=>{if(v.status==='PUBLISHED'&&!v.publishConfirmed)c.addIssue({code:'custom',message:'홈페이지·앱 공개를 확인해 주세요.'});});
export const bulletinUploadGrant=z.object({uploadUrl:z.url(),receipt:z.string().min(10).max(4000)});
