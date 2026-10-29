import {z} from 'zod';
export const mediaId=z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const imageMime=z.enum(['image/jpeg','image/png','image/webp']);
export const mediaQuery=z.object({page:z.coerce.number().int().min(0).max(10000).default(0),q:z.string().trim().max(100).default('')}).strict();
export const mediaCommand=z.discriminatedUnion('operation',[
 z.object({operation:z.literal('PREPARE_IMAGE'),name:z.string().trim().min(1).max(240),mimeType:imageMime,size:z.number().int().positive().max(2*1024*1024)}).strict(),
 z.object({operation:z.literal('COMPLETE_IMAGE'),receipt:z.string().min(1).max(4000)}).strict(),
]);
export const managedMedia=z.object({id:mediaId,name:z.string(),mimeType:z.string(),size:z.number().int().nonnegative(),url:z.url(),width:z.number().nullable(),height:z.number().nullable()});
export type ManagedMedia=z.infer<typeof managedMedia>;
export const mediaPage=z.object({data:z.array(managedMedia),nextPage:z.number().nullable()});
