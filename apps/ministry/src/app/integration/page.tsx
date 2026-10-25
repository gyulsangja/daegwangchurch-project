import {workspace} from '@/lib/workspace';
import {integrationInbox} from '@/lib/integration';
import {IntegrationWorkspace} from '@/components/integration-workspace';
export default async function Page(){
 const {service,actor}=await workspace();const inbox=await integrationInbox(actor);
 const candidates=inbox.configured?await service.families.candidates(actor):[];
 const members=await Promise.all(candidates.map(async c=>{const member=await service.detail(actor,c.id);return {id:c.id,name:c.name,version:member.version,phone:member.privateProfile?.phone??''};}));
 return <><div className="page-heading"><div><h1>홈페이지·앱 연결</h1><p>콘텐츠 원본을 유지하고, 회원과 돌봄 요청을 목회 업무에 연결합니다.</p></div></div><section className="panel detail-body"><h2>기존 콘텐츠 관리</h2><div className="pastoral-toolbar">{[['공지사항','notices'],['주보','bulletins'],['설교·예배','worship'],['교인 승인','members'],['상담 접수','care']].map(([label,path])=><a key={path} className="button" href={`https://daegwangchurch-admin.vercel.app/admin/${path}`} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}</div><p className="muted">기존 관리자에 별도 로그인이 필요할 수 있습니다. 같은 게시물을 다시 등록하지 않습니다.</p></section><IntegrationWorkspace inbox={inbox} members={members} today={new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'})}/></>;
}
