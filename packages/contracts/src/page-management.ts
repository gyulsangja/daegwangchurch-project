import {z} from 'zod';
import {homePageSchema,churchPageSchema,visionPageSchema,newcomerEducationSchema} from './features/pages/schema';
import {normalizeHomePageContent,normalizeChurchContent,normalizeVisionContent,normalizeNewcomerEducationContent,pageKeys} from './features/pages/content';
export const fixedPageKind=z.enum(['home','church','vision','newcomerEducation']);
export type FixedPageKind=z.infer<typeof fixedPageKind>;
export const fixedPageQuery=z.object({kind:fixedPageKind}).strict();
const version=z.iso.datetime().nullable();
export const fixedPageCommand=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('home'),expectedUpdatedAt:version,values:homePageSchema,confirmed:z.boolean()}),
 z.object({kind:z.literal('church'),expectedUpdatedAt:version,values:churchPageSchema,confirmed:z.boolean()}),
 z.object({kind:z.literal('vision'),expectedUpdatedAt:version,values:visionPageSchema,confirmed:z.boolean()}),
 z.object({kind:z.literal('newcomerEducation'),expectedUpdatedAt:version,values:newcomerEducationSchema,confirmed:z.boolean()}),
]).refine(v=>v.values.status!=='PUBLISHED'||v.confirmed,'홈페이지에 공개할 내용을 확인해 주세요.');
export const fixedPageResult=z.object({kind:fixedPageKind,expectedUpdatedAt:version,values:z.record(z.string(),z.union([z.string(),z.boolean()]))});
export const fixedPageInfo={home:{key:pageKeys.home,title:'메인 화면',path:'/'},church:{key:pageKeys.church,title:'교회소개',path:'/about/church'},vision:{key:pageKeys.vision,title:'비전과 사명',path:'/about/vision'},newcomerEducation:{key:pageKeys.newcomerEducation,title:'새가족 교육',path:'/newcomer/education'}};
type Content=Parameters<typeof normalizeChurchContent>[0];
export function pageEditorValues(kind:FixedPageKind,content:Content,status:string):Record<string,string|boolean>{
 if(kind==='home')return {...normalizeHomePageContent(content),status};
 if(kind==='church'){const {values,...rest}=normalizeChurchContent(content);return {...rest,...Object.fromEntries(values.flatMap((v,i)=>[[`value${i+1}Title`,v.title],[`value${i+1}Description`,v.description]])),status};}
 if(kind==='vision'){const {directions,...rest}=normalizeVisionContent(content);return {...rest,...Object.fromEntries(directions.map((v,i)=>[`direction${i+1}`,v])),status};}
 const {steps,...rest}=normalizeNewcomerEducationContent(content);return {...rest,...Object.fromEntries(steps.flatMap((v,i)=>[[`step${i+1}Title`,v.title],[`step${i+1}Description`,v.description]])),status};
}
export function fixedPageContent(input:z.infer<typeof fixedPageCommand>){
 const {status,...fields}=input.values;const content:Record<string,unknown>={...fields};
 if(input.kind==='church'){content.values=[1,2,3].map(i=>({title:content[`value${i}Title`],description:content[`value${i}Description`]}));for(const i of [1,2,3]){delete content[`value${i}Title`];delete content[`value${i}Description`];}}
 if(input.kind==='vision'){content.directions=[1,2,3].map(i=>content[`direction${i}`]);for(const i of [1,2,3])delete content[`direction${i}`];}
 if(input.kind==='newcomerEducation'){content.steps=[1,2,3,4,5].map(i=>({title:content[`step${i}Title`],description:content[`step${i}Description`]}));for(const i of [1,2,3,4,5]){delete content[`step${i}Title`];delete content[`step${i}Description`];}}
 return {status,content,description:input.values.heroDescription};
}
type Field=[string,string,('textarea'|'checkbox')?];type Section={title:string;fields:Field[]};
const hero:Section={title:'대표 안내',fields:[['heroTitle','대표 제목'],['heroDescription','대표 설명','textarea']]};
export const fixedPageSections:Record<FixedPageKind,Section[]>={
 home:[{title:'대표 인사',fields:[['heroBadge','상단 안내 문구'],['heroTitleBefore','제목 첫 줄'],['heroTitleAccent','강조 문구'],['heroTitleAfter','제목 마지막 줄'],['heroDescription','인사 설명','textarea']]},{title:'교회·새가족 소개',fields:[['churchTitle','교회 소개 제목'],['churchDescription','교회 소개 설명','textarea'],['welcomeTitle','새가족 환영 제목'],['welcomeDescription','새가족 환영 설명','textarea']]},{title:'홈페이지 영역 표시',fields:[['showWorship','주일 말씀·첫시간 영역','checkbox'],['showNews','주보·공지·일정 영역','checkbox'],['showChurch','교회 소개 영역','checkbox'],['showWelcome','새가족 안내 영역','checkbox']]}],
 church:[hero,{title:'교회 소개',fields:[['sinceLabel','시작 연도 표기'],['motto','교회 표어','textarea'],['sectionTitle','소개 제목'],['body','소개 내용','textarea']]},{title:'소중히 여기는 가치',fields:[1,2,3].flatMap(i=>[[`value${i}Title`,`${i}번째 가치 제목`],[`value${i}Description`,`${i}번째 가치 설명`,'textarea']] as Field[])}],
 vision:[hero,{title:'목회철학과 방향',fields:[['philosophy','목회철학','textarea'],['motto','교회 표어','textarea'],['directionTitle','방향 제목'],['directionDescription','방향 설명','textarea'],['direction1','첫 번째 방향'],['direction2','두 번째 방향'],['direction3','세 번째 방향']]}],
 newcomerEducation:[hero,{title:'교육 안내',fields:[['processTitle','과정 제목'],['duration','교육 기간'],['location','교육 장소'],['leader','담당자'],['applicationInfo','신청 안내','textarea']]},{title:'교육 단계',fields:[1,2,3,4,5].flatMap(i=>[[`step${i}Title`,`${i}단계 제목`],[`step${i}Description`,`${i}단계 설명`,'textarea']] as Field[])}],
};
