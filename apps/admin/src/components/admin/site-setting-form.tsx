"use client";
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import {LoaderCircle,Save} from 'lucide-react';
import {useActionState,useState} from 'react';
import {Button} from '@daegwang/web-ui/components/ui/button';
import {saveSiteSettingAction,type SiteSettingActionState} from '../../features/settings/actions';
import type {PublicSiteSettings} from '@daegwang/server/features/settings/queries';
const sections=[{id:'offering',label:'헌금 계좌',fields:['offeringBank','offeringNumber','offeringHolder','offeringNote']},{id:'basic',label:'기본 정보',fields:['siteName','description','canonicalUrl']},{id:'contact',label:'주소·연락처',fields:['address','addressDetail','phone','email','mapLatitude','mapLongitude','transitInfo','parkingInfo']},{id:'channels',label:'채널·담당자',fields:['youtubeUrl','privacyOfficer','privacyContact']}];
export function SiteSettingForm({values}:{values:PublicSiteSettings}){
 const [state,action,pending]=useActionState(saveSiteSettingAction,{} as SiteSettingActionState);const [selection,setSelection]=useState<{id:string;errors:SiteSettingActionState['errors']}>({id:'basic',errors:undefined});
 const firstError=sections.find(item=>item.fields.some(field=>state.errors?.[field]?.length));
 const section=selection.errors!==state.errors&&firstError?firstError.id:selection.id;
 const error=(name:string)=>state.errors?.[name]?.[0];
 const field=(name:keyof PublicSiteSettings,label:string,options?:{type?:string;multiline?:boolean;helper?:string;step?:string})=><TextField key={name} fullWidth name={name} label={label} type={options?.type} multiline={options?.multiline} minRows={options?.multiline?3:undefined} defaultValue={values[name]??''} error={Boolean(error(name))} helperText={error(name)??options?.helper} slotProps={options?.step?{htmlInput:{step:options.step}}:undefined}/>;
 return <form action={action} noValidate data-unsaved-warning className="mt-6 space-y-5">
 <input type="hidden" name="expectedUpdatedAt" value={state.expectedUpdatedAt??values.expectedUpdatedAt??''}/><nav aria-label="기본 정보 편집 항목" className="flex flex-wrap gap-2">{sections.map(item=><button key={item.id} type="button" aria-pressed={section===item.id} onClick={()=>setSelection({id:item.id,errors:state.errors})} className={`focus-ring min-h-11 rounded-xl border border-border px-4 text-sm font-semibold ${section===item.id?'bg-primary-50 text-primary-700':'bg-white'}`}>{item.label}{item.fields.some(field=>error(field))?' · 확인 필요':''}</button>)}</nav>
 {state.message&&<Alert severity={state.success?'success':'error'}>{state.message}</Alert>}
 <div className="rounded-2xl border border-border bg-white p-5 sm:p-7">
 <section hidden={section!=='offering'} aria-label="헌금 계좌"><p className="mb-5 text-sm text-text-secondary">홈페이지와 앱의 헌금 안내에 함께 표시됩니다. 계좌를 비공개로 하려면 은행·계좌번호·예금주를 모두 비워 주세요.</p><div className="grid gap-6">{field('offeringBank','은행명')}{field('offeringNumber','계좌번호')}{field('offeringHolder','예금주')}{field('offeringNote','헌금 안내 문구',{multiline:true})}</div></section>
 <section hidden={section!=='basic'} aria-label="기본 정보"><div className="grid gap-6">{field('siteName','교회명')}{field('description','교회·사이트 설명',{multiline:true,helper:'검색 결과와 푸터 소개에 사용됩니다.'})}{field('canonicalUrl','대표 홈페이지 URL',{type:'url',helper:'예: https://daegwangchurch.kr'})}</div></section>
 <section hidden={section!=='contact'} aria-label="주소와 연락처"><div className="grid gap-6">{field('address','도로명 주소')}{field('addressDetail','상세 주소')}<div className="grid gap-6 sm:grid-cols-2">{field('phone','대표 전화',{type:'tel'})}{field('email','대표 이메일',{type:'email'})}</div><div className="grid gap-6 sm:grid-cols-2">{field('mapLatitude','지도 위도',{type:'number',step:'any'})}{field('mapLongitude','지도 경도',{type:'number',step:'any'})}</div>{field('transitInfo','대중교통 안내',{multiline:true})}{field('parkingInfo','주차 안내',{multiline:true})}</div></section>
 <section hidden={section!=='channels'} aria-label="외부 채널과 개인정보 담당"><div className="grid gap-6">{field('youtubeUrl','YouTube 채널 URL',{type:'url'})}<div className="grid gap-6 sm:grid-cols-2">{field('privacyOfficer','개인정보 보호 담당자')}{field('privacyContact','개인정보 문의 연락처')}</div></div></section>
 </div>
 <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-sm"><p className="hidden text-sm text-text-secondary sm:block">탭을 바꿔도 입력은 유지됩니다. 저장하면 모든 항목이 함께 반영됩니다.</p><Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending?<LoaderCircle aria-hidden="true" className="size-4 animate-spin"/>:<Save aria-hidden="true" className="size-4"/>}{pending?'저장 중':'변경사항 저장'}</Button></div>
 </form>;
}
