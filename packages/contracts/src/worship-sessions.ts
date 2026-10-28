import {z} from 'zod';
export const worshipResources=z.array(z.object({kind:z.enum(['BULLETIN','WORSHIP']),id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)}).strict()).max(50).refine(rows=>new Set(rows.map(r=>r.kind+':'+r.id)).size===rows.length,'같은 자료를 중복 연결할 수 없습니다.');
export const worshipSessionInput=z.object({id:z.uuid(),version:z.number().int().positive().nullable(),date:z.iso.date(),name:z.string().trim().min(1).max(120),status:z.enum(['PREPARING','COMPLETED','CANCELLED','ARCHIVED']),notes:z.string().trim().max(8000),resources:worshipResources}).strict();
export const worshipSessionQuery=z.object({month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),page:z.coerce.number().int().min(0).max(10000).default(0)}).strict();
export const worshipSessionRow=worshipSessionInput.extend({version:z.number().int().positive()});
export const worshipSessionPage=z.object({data:z.array(worshipSessionRow),nextPage:z.number().int().nullable()});
export type WorshipSession=z.infer<typeof worshipSessionRow>;
