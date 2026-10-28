import {workspace} from '@/lib/workspace';
import {integrationInbox} from '@/lib/integration';
import {IntegrationWorkspace} from '@/components/integration-workspace';
import Link from 'next/link';
export default async function Page(){
 const {service,actor}=await workspace();const inbox=await integrationInbox(actor);
 const members=inbox.configured?await service.linkCandidates(actor):[];
 return <><div className="page-heading"><div><h1>회원·목회 업무 연결</h1><p>회원 계정과 교적을 대조하고, 접수된 돌봄 요청을 목회 일정에 연결합니다.</p></div></div><section className="panel detail-body"><h2>관련 업무</h2><div className="pastoral-toolbar"><Link className="button" href="/church/manage">일정·공지 관리</Link><Link className="button" href="/worship">주보·말씀 관리</Link>{actor.permissions?.includes('CARE')&&<Link className="button" href="/intake">문의·돌봄 접수함</Link>}<Link className="button" href="/app-members">교인 승인·앱 회원 관리</Link></div></section><IntegrationWorkspace inbox={inbox} members={members} today={new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'})}/></>;
}
