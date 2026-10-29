import {z} from 'zod';
import {albumFormSchema} from './features/albums/schema';
import {managedMedia,mediaId} from './media-management';
export const albumQuery=z.object({id:mediaId.optional(),page:z.coerce.number().int().min(0).max(10000).default(0),q:z.string().trim().max(100).default('')}).strict();
export const albumSave=z.object({operation:z.literal('SAVE'),id:mediaId,expectedUpdatedAt:z.iso.datetime().nullable(),data:albumFormSchema,coverImageId:mediaId,images:z.array(z.object({mediaId,caption:z.string().trim().max(300)}).strict()).min(1).max(30),publishConfirmed:z.boolean()}).strict().superRefine((v,c)=>{
 if(v.expectedUpdatedAt===null&&!z.uuid().safeParse(v.id).success)c.addIssue({code:'custom',message:'새 앨범 ID를 확인해 주세요.'});
 if(new Set(v.images.map(i=>i.mediaId)).size!==v.images.length)c.addIssue({code:'custom',message:'같은 사진은 한 번만 선택해 주세요.'});
 if(!v.images.some(i=>i.mediaId===v.coverImageId))c.addIssue({code:'custom',message:'앨범 사진 중 대표사진을 선택해 주세요.'});
 if(v.data.status==='PUBLISHED'&&!v.publishConfirmed)c.addIssue({code:'custom',message:'사진과 설명 공개를 확인해 주세요.'});
});
export const albumDelete=z.object({operation:z.literal('DELETE'),id:mediaId,expectedUpdatedAt:z.iso.datetime(),confirmed:z.literal(true)}).strict();
export const albumCommand=z.union([albumSave,albumDelete]);
export const albumSummary=z.object({id:mediaId,title:z.string(),category:z.string(),eventDate:z.iso.date(),status:z.enum(['DRAFT','PUBLISHED','PRIVATE','ARCHIVED']),showOnMain:z.boolean(),updatedAt:z.iso.datetime(),imageCount:z.number(),coverImage:managedMedia.nullable()});
export const albumDetail=albumSummary.extend({description:z.string(),images:z.array(z.object({media:managedMedia,caption:z.string()}))});
export const albumPage=z.object({data:z.array(albumSummary),nextPage:z.number().nullable()});
export type AlbumSummary=z.infer<typeof albumSummary>;
export type AlbumDetail=z.infer<typeof albumDetail>;
