import {z} from 'zod';
export const systemToolsQuery=z.object({kind:z.enum(['ACTIVITY','FILES']),page:z.coerce.number().int().min(0).max(10000).default(0)}).strict();
export const systemToolsCommand=z.object({operation:z.literal('CLEANUP'),ids:z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)).min(1).max(200).refine(v=>new Set(v).size===v.length),confirmed:z.literal(true)}).strict();
export const systemToolsPage=z.object({kind:z.enum(['ACTIVITY','FILES']),data:z.array(z.object({id:z.string(),title:z.string(),description:z.string(),at:z.string(),size:z.number().optional()})),nextPage:z.number().nullable()});
