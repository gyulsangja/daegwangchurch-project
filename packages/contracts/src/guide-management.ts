import {z} from 'zod';
import {personFormSchema} from './features/people/schema';
import {ministryFormSchema,ministryTypeLabels} from './features/ministries/schema';
import {scheduleFormSchema} from './features/schedules/schema';
import {historyFormSchema} from './features/history/schema';
import {managedMedia,mediaId} from './media-management';
export const guideKind=z.enum(['PEOPLE','MINISTRIES','SCHEDULES','HISTORY']);
export type GuideKind=z.infer<typeof guideKind>;
export const guideLabels={PEOPLE:'섬기는 사람들',MINISTRIES:'교회학교·부서 소개',SCHEDULES:'예배 시간 안내',HISTORY:'교회 연혁'};
export const guideQuery=z.object({kind:guideKind,id:mediaId.optional(),page:z.coerce.number().int().min(0).max(10000).default(0),q:z.string().trim().max(100).default('')}).strict();
const base={operation:z.literal('SAVE'),id:mediaId,expectedUpdatedAt:z.iso.datetime().nullable(),imageId:mediaId.nullable(),publishConfirmed:z.boolean()};
export const guideSave=z.discriminatedUnion('kind',[
 z.object({...base,kind:z.literal('PEOPLE'),data:personFormSchema.omit({removeProfileImage:true})}).strict(),
 z.object({...base,kind:z.literal('MINISTRIES'),data:ministryFormSchema.omit({removeCoverImage:true})}).strict(),
 z.object({...base,kind:z.literal('SCHEDULES'),data:scheduleFormSchema}).strict(),
 z.object({...base,kind:z.literal('HISTORY'),data:historyFormSchema}).strict(),
]).superRefine((v,c)=>{
 if(v.expectedUpdatedAt===null&&!z.uuid().safeParse(v.id).success)c.addIssue({code:'custom',message:'새 자료 ID를 확인해 주세요.'});
 if((v.kind==='MINISTRIES'?v.data.status==='PUBLISHED':v.data.isVisible)&&!v.publishConfirmed)c.addIssue({code:'custom',message:'공개할 내용을 확인해 주세요.'});
 if(v.kind==='HISTORY'&&v.data.day&&(!v.data.month||v.data.day>new Date(Date.UTC(v.data.year,v.data.month,0)).getUTCDate()))c.addIssue({code:'custom',message:'실제 존재하는 연월일을 선택해 주세요.'});
 if((v.kind==='HISTORY'||v.kind==='SCHEDULES')&&v.imageId)c.addIssue({code:'custom',message:'이 항목에는 이미지를 연결할 수 없습니다.'});
});
export const guideCommand=z.union([guideSave,z.object({operation:z.literal('DELETE'),kind:guideKind,id:mediaId,expectedUpdatedAt:z.iso.datetime(),confirmed:z.literal(true)}).strict()]);
export const guideSummary=z.object({id:mediaId,title:z.string(),subtitle:z.string(),visible:z.boolean(),sortOrder:z.number(),updatedAt:z.iso.datetime()});
export const guideDetail=guideSummary.extend({kind:guideKind,values:z.record(z.string(),z.union([z.string(),z.boolean(),z.number()])),image:managedMedia.nullable()});
export const guidePage=z.object({data:z.array(guideSummary),nextPage:z.number().nullable()});
export type GuideDetail=z.infer<typeof guideDetail>;
export type GuideField={key:string;label:string;type:'text'|'textarea'|'checkbox'|'number'|'select';required?:boolean;max?:number;options?:Record<string,string>};
const text=(key:string,label:string,max:number,required=false):GuideField=>({key,label,max,required,type:'text'});
const area=(key:string,label:string,max:number,required=false):GuideField=>({key,label,max,required,type:'textarea'});
const check=(key:string,label:string):GuideField=>({key,label,type:'checkbox'});
export const guideFields:Record<GuideKind,GuideField[]>={
 PEOPLE:[text('name','이름',80,true),text('position','직분·직책',80,true),text('ministry','담당 사역',120),area('introduction','소개',5000),area('careerText','약력 · 한 줄에 하나씩',3000),area('quote','인사말',500),check('isSeniorPastor','담임목회자로 표시'),check('isVisible','공개 페이지에 표시')],
 MINISTRIES:[text('name','부서·사역 이름',100,true),{key:'type',label:'구분',type:'select',options:ministryTypeLabels},area('introduction','소개',5000,true),text('audience','대상',120),text('meetingDay','모임 요일',80),text('meetingTime','모임 시간',80),text('location','장소',160),text('leader','담당자',100),text('contactName','공개 연락 담당',100),text('contactValue','공개 연락처',200),check('showContact','연락처 공개'),area('programText','주요 활동 · 한 줄에 하나씩',3000),{key:'status',label:'공개 상태',type:'select',options:{DRAFT:'임시저장',PUBLISHED:'공개',PRIVATE:'비공개'}}],
 SCHEDULES:[text('name','예배·모임 이름',80,true),text('dayLabel','요일',40,true),text('timeLabel','시간',80,true),text('location','장소',120),area('note','안내 사항',500),check('isVisible','공개 페이지에 표시')],
 HISTORY:[{key:'year',label:'연도',type:'select',options:Object.fromEntries(Array.from({length:401},(_,i)=>[String(1800+i),`${1800+i}년`]))},{key:'month',label:'월 · 선택',type:'select',options:{'':'월 미지정',...Object.fromEntries(Array.from({length:12},(_,i)=>[String(i+1),`${i+1}월`]))}},{key:'day',label:'일 · 선택',type:'select',options:{'':'일 미지정',...Object.fromEntries(Array.from({length:31},(_,i)=>[String(i+1),`${i+1}일`]))}},text('title','연혁 제목',160,true),area('content','내용',2000),check('isVisible','공개 페이지에 표시')],
};
export function emptyGuideValues(kind:GuideKind,id:string){const result:Record<string,string|number|boolean>={sortOrder:0,...(kind==='HISTORY'?{year:new Date().getFullYear(),month:'',day:''}:{}),...(kind==='MINISTRIES'?{slug:`ministry-${id.slice(0,8)}`,type:'OTHER',status:'DRAFT'}:{isVisible:false})};for(const field of guideFields[kind])if(!(field.key in result))result[field.key]=field.type==='checkbox'?false:'';return result;}
