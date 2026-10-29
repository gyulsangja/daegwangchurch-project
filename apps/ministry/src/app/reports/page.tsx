import {Suspense} from 'react';
import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {summaryReport} from '@/lib/summary-report';
import {CountChart} from '@/components/ministry-charts';
import {PageLoading} from '@/components/page-loading';
import {monthSchema} from '@daegwang/contracts/features/calendar';
async function Report({month}:{month:string}){const {actor}=await workspace();const data=await summaryReport(actor,month);const labels:Record<string,string>={PRESENT:'현장 출석',ONLINE:'온라인',ABSENT:'결석',EXCUSED:'사유 결석'};return <><p>현재 교적 {data.total}명</p><div className="pastoral-cards"><CountChart title="현재 교적 상태" data={data.members}/><CountChart title={`${month} 출석 기록`} unit="건" data={data.attendance.map((row:{state:string;count:number})=>({name:labels[row.state]??'기타',count:row.count}))}/></div></>;}
export default async function Page({searchParams}:{searchParams:Promise<{month?:string}>}){const {actor}=await workspace();if(!['ADMIN','OFFICE','COUNCIL'].includes(actor.role))redirect('/access-denied');const month=monthSchema.safeParse((await searchParams).month).data??new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'}).slice(0,7);return <><div className="page-heading"><div><h1>교회 운영 현황</h1><p>개인 정보나 상담 내용 없이 교적·출석의 전체 흐름을 확인합니다.</p></div></div><form className="pastoral-toolbar"><label>출석 조회 월<input type="month" name="month" defaultValue={month} required/></label><button className="button">조회</button></form><Suspense key={month} fallback={<PageLoading title="운영 현황" cards/>}><Report month={month}/></Suspense><p className="muted">출석은 해당 월에 입력한 기록 건수이며 한 사람이 여러 예배에 참석하면 각각 집계합니다. 미입력 출석은 포함하지 않습니다.</p></>;}
