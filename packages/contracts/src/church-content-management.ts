import {z} from 'zod';
import {eventFormSchema} from './features/events/schema';
import {noticeFormSchema} from './features/notices/schema';
import {mediaId,managedMedia} from './media-management';

export const contentKind=z.enum(['EVENT','NOTICE']);
export const contentQuery=z.object({kind:contentKind,page:z.coerce.number().int().min(0).max(10000).default(0),q:z.string().trim().max(100).default(''),id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/).optional()}).strict();
const version=z.iso.datetime();
const base={id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),expectedUpdatedAt:version.nullable(),publishConfirmed:z.boolean().default(false)};
export const contentSave=z.discriminatedUnion('kind',[
 z.object({...base,kind:z.literal('EVENT'),data:eventFormSchema,coverImageId:mediaId.nullable().optional()}).strict(),
 z.object({...base,kind:z.literal('NOTICE'),data:noticeFormSchema,attachmentIds:z.array(mediaId).max(10).refine(ids=>new Set(ids).size===ids.length).optional()}).strict(),
]).superRefine((value,ctx)=>{
 if(value.expectedUpdatedAt===null&&!z.uuid().safeParse(value.id).success)ctx.addIssue({code:'custom',path:['id'],message:'새 게시물 ID를 확인해 주세요.'});
 if(value.data.status==='PUBLISHED'&&!value.publishConfirmed)ctx.addIssue({code:'custom',path:['publishConfirmed'],message:'공개 및 기존 알림 정책 적용을 확인해 주세요.'});
 const dates=value.kind==='EVENT'?[value.data.startsAt,value.data.endsAt]:[value.data.publishStartsAt,value.data.publishEndsAt];
 if(dates.some(date=>date&&!z.iso.datetime({offset:true}).safeParse(date).success))ctx.addIssue({code:'custom',message:'시간대가 포함된 날짜를 입력해 주세요.'});
});
export const contentRow=z.object({id:z.string(),kind:contentKind,title:z.string(),category:z.string(),status:z.enum(['DRAFT','PUBLISHED','PRIVATE','ARCHIVED']),updatedAt:version,body:z.string(),startsAt:z.string(),endsAt:z.string(),isAllDay:z.boolean(),location:z.string(),ministryName:z.string(),isImportant:z.boolean(),isPinned:z.boolean(),publishStartsAt:z.string(),publishEndsAt:z.string(),attachmentCount:z.number().int().nonnegative()});
export const contentDetail=contentRow.extend({attachments:z.array(managedMedia).optional(),coverImage:managedMedia.nullable().optional()});
export const contentPage=z.object({data:z.array(contentDetail),nextPage:z.number().int().nonnegative().nullable()});
export type ContentRow=z.infer<typeof contentRow>;
export type ContentSave=z.infer<typeof contentSave>;
