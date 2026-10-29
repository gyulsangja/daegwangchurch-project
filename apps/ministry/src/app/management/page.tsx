import {SystemTools} from '@/components/system-tools';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {OperationsSettings} from '@/components/operations-settings';
const groups=[{title:'사용자와 접근',items:[{href:'/users',title:'사용자·권한',description:'초대, 담당 업무·조직, 이용 중지와 권한 이력'},{href:'/app-members',title:'앱 회원·관리자',description:'회원 확인, 교인 승인과 기존 콘텐츠 관리자 권한'},{href:'/account/security',title:'내 로그인·보안',description:'비밀번호와 선택적 2단계 인증'}]},{title:'교회 운영 기준',items:[{href:'/settings',title:'연도·직분·조직',description:'연간 조직과 구성원의 역할·이력'},{href:'/app-groups',title:'모임·앱 소속',description:'모임 설정, 공지 담당자와 공식 소속 연결'},{href:'/church-settings',title:'교회 공개 정보',description:'주소·연락처·지도·헌금·채널 안내'}]}];
export default async function Page(){const {actor}=await workspace();if(actor.role!=='ADMIN')redirect('/access-denied');return <><div className="page-heading"><div><h1>관리자 설정</h1><p>사용자 접근, 교회 운영 기준과 접수 정책을 관리합니다.</p></div></div>{groups.map(group=><section key={group.title} className="detail-body"><h2>{group.title}</h2><div className="pastoral-cards">{group.items.map(item=><Link key={item.href} href={item.href} className="panel detail-body"><h3>{item.title} →</h3><p className="muted">{item.description}</p></Link>)}</div></section>)}<OperationsSettings/><SystemTools canDelete={actor.canDelete===true}/></>;}
