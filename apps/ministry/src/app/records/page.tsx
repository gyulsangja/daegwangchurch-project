import Link from 'next/link';
import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {RecordWorkspace} from '@/components/record-workspace';
export default async function Page({searchParams}:{searchParams:Promise<{kind?:string}>}){
 const {service,actor,config}=await workspace();const q=await searchParams;if(q.kind==='CARE')redirect('/care');const kind=q.kind==='CARE'?'CARE':q.kind==='SERVICE'?'SERVICE':'EDUCATION';
 if(!['ADMIN','OFFICE'].includes(actor.role)||(kind==='CARE'&&!actor.permissions?.includes('CARE')))redirect('/access-denied');
 const current=await service.years.read(actor,config.activeYear);const members=[];let page=1;for(;;){const result=await service.list(actor,{page});members.push(...result.items);if(page*result.pageSize>=result.total)break;page++;}
 const data=await service.records.workspace(actor,kind);
 return <><div className="page-heading"><div><p className="eyebrow">업무에서 기록하고 교적에서 함께 확인</p><h1>{kind==='EDUCATION'?'교육 운영':kind==='SERVICE'?'봉사 기록':'상담·심방 결과 기록'}</h1><p>내용을 한 번 입력하고 참여자를 선택하세요. 저장한 기록은 각 교인의 교적에 함께 표시됩니다.</p></div><Link className="button" href={kind==='CARE'?'/print?type=care':'/print?type=records'}>기록 출력</Link></div><nav className="pastoral-toolbar"><Link className="button" href="/records">교육 운영</Link><Link className="button" href="/records?kind=SERVICE">봉사 기록</Link>{actor.permissions?.includes('CARE')&&<Link className="button" href="/care">상담·심방</Link>}<Link className="button" href="/attendance">예배 출석부</Link><Link className="button" href="/organizations">조직별 배정</Link></nav><RecordWorkspace key={`${kind}-${data.revision}`} kind={kind} data={data} members={members} organizations={config.organizations} courses={current.courses} roles={current.roles}/></>;
}
