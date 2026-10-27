import Link from 'next/link';
import styles from './church.module.css';
import {Suspense} from 'react';
import {workspace} from '@/lib/workspace';
import {readChurchPublicContent} from '@/lib/church-public-content';
import {canReadPastoralCalendar} from '@daegwang/ministry-core/calendar-access';
import {monthSchema} from '@daegwang/contracts/features/calendar';
import {PageLoading} from '@/components/page-loading';

const date=(value:string,allDay=false)=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',...(allDay?{}:{timeStyle:'short'})});
const pageNumber=(value?:string)=>value&&/^\d{1,5}$/.test(value)?Math.min(Number(value),10000):0;
function href(month:string,eventPage:number,noticePage:number){return `/church?${new URLSearchParams({month,eventPage:String(eventPage),noticePage:String(noticePage)})}`;}
async function Published({kind,month,page,otherPage}:{kind:'events'|'notices';month:string;page:number;otherPage:number}){
  let result;
  try{result=await readChurchPublicContent(kind,month,page);}catch{return <section className="panel detail-body"><h2>{kind==='events'?'교회 공개 일정':'공개 공지사항'}</h2><p role="status">공개 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><Link className="button" href={href(month,kind==='events'?page:otherPage,kind==='notices'?page:otherPage)}>다시 불러오기</Link></section>;}
  const link=(next:number)=>href(month,kind==='events'?next:otherPage,kind==='notices'?next:otherPage);
  return <section className="panel detail-body"><h2>{kind==='events'?`${month} 교회 공개 일정`:'최근 공개 공지사항'}</h2><p className="muted">{kind==='events'?'홈페이지·앱에 공개된 같은 일정입니다.':'선택한 월과 관계없이 현재 게시 중인 공지입니다.'}</p>
    {!result.data.length?<p className="empty">{page?'이 페이지에 자료가 없습니다.':'현재 공개된 자료가 없습니다.'}</p>:<ul className="history-list">{result.data.map(row=><li key={row.id}><strong>{row.title}</strong><p>{'startsAt'in row?<>{date(row.startsAt,row.isAllDay)}{row.endsAt&&` ~ ${date(row.endsAt,row.isAllDay)}`}{row.isAllDay&&' · 종일'}{row.location&&` · ${row.location}`}</>:<>{'isImportant'in row&&row.isImportant?'중요 · ':''}{'publishedAt'in row&&date(row.publishedAt,true)}{'attachmentCount'in row&&row.attachmentCount>0&&` · 첨부 ${row.attachmentCount}개`}</>}</p></li>)}</ul>}
    <div className="chips">{page>0&&<Link className="button" href={link(page-1)}>이전 페이지</Link>}{result.nextPage!==null&&<Link className="button" href={link(result.nextPage)}>다음 페이지</Link>}<a className="button" href={`https://daegwangchurch.kr/news/${kind}`} target="_blank" rel="noopener noreferrer">홈페이지에서 보기 ↗</a></div>
  </section>;
}
async function Pastoral({month}:{month:string}){
  const {service,actor}=await workspace();
  if(!canReadPastoralCalendar(actor))return null;
  const rows=await service.pastoral.calendar(actor,month);
  const labels={CARE:'상담·심방',PRAYER:'목회 기도',GOAL:'목회 목표',PLAN:'실행 계획'};
  const paths={CARE:'care',PRAYER:'prayers',GOAL:'plans',PLAN:'plans'};
  return <section className="panel detail-body"><h2>{month} 내부 목회 일정·계획</h2><p className="muted">상담 권한이 있는 담당자만 볼 수 있습니다. 홈페이지·앱에는 공개되지 않습니다.</p>{!rows.length?<p className="empty">이달에 해당하는 목회 일정·계획이 없습니다.</p>:<ul className="history-list">{rows.map(row=><li key={row.id}><Link href={`/${paths[row.kind]}?activity=${encodeURIComponent(row.id)}`}><strong>{row.title}</strong></Link><p>{labels[row.kind]} · {row.scope==='ONGOING'?'상시':row.scope==='YEAR'?`${row.period}년`:row.scope==='MONTH'?row.period:row.date} · {row.status==='DONE'?'완료':'진행 중'}</p></li>)}</ul>}</section>;
}
export default async function Page({searchParams}:{searchParams:Promise<{month?:string;eventPage?:string;noticePage?:string}>}){
  const params=await searchParams;
  const month=monthSchema.safeParse(params.month).data??new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}).slice(0,7);
  const eventPage=pageNumber(params.eventPage),noticePage=pageNumber(params.noticePage);
  const {actor}=await workspace();
  return <><div className="page-heading"><div><h1>교회 일정·공지</h1><p>교회에 알린 소식과 이달의 목회 일정을 함께 확인합니다.</p></div></div>
    <form className="pastoral-toolbar" action="/church"><label>조회 월 <input type="month" name="month" defaultValue={month} required/></label><button className="button primary">조회</button></form>
    {['ADMIN','CONTENT'].includes(actor.role)&&<details className={styles.management}><summary>일정·공지 등록과 수정</summary><div className="chips"><Link className="button primary" href="/church/manage">이곳에서 일정·공지 관리</Link><a className="button" href="https://daegwangchurch-admin.vercel.app/admin/events" target="_blank" rel="noopener noreferrer">일정 관리 ↗</a><a className="button" href="https://daegwangchurch-admin.vercel.app/admin/notices" target="_blank" rel="noopener noreferrer">공지 관리 ↗</a></div><p className="muted">목회 콘텐츠 담당 권한과 기존 콘텐츠 관리 권한을 함께 확인합니다. 첨부파일은 기존 관리자에서 관리하며, 저장된 공개 자료는 다시 조회하면 반영됩니다.</p></details>}
    <div className={styles.content}><Suspense key={`events-${month}-${eventPage}`} fallback={<PageLoading title="교회 공개 일정" cards/>}><Published kind="events" month={month} page={eventPage} otherPage={noticePage}/></Suspense>
    <Suspense key={`pastoral-${month}`} fallback={<p role="status">목회 일정을 불러오는 중…</p>}><Pastoral month={month}/></Suspense>
    <Suspense key={`notices-${noticePage}`} fallback={<PageLoading title="공개 공지사항" cards/>}><Published kind="notices" month={month} page={noticePage} otherPage={eventPage}/></Suspense></div>
  </>;
}
