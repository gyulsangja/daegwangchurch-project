import {z} from 'zod';
export const ministryContentLink=z.object({kind:z.enum(['EVENT','NOTICE']),id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)}).strict();
export const ministryContentLinks=z.array(ministryContentLink).max(20).refine(rows=>new Set(rows.map(r=>`${r.kind}:${r.id}`)).size===rows.length,'같은 게시물을 중복 연결할 수 없습니다.');
export type MinistryContentLink=z.infer<typeof ministryContentLink>;
