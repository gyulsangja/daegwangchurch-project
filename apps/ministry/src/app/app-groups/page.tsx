import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {GroupWorkspace} from '@/components/group-workspace';
export default async function Page(){const {actor}=await workspace();if(actor.role!=='ADMIN')redirect('/access-denied');return <><div className="page-heading"><div><h1>모임 소식·앱 소속</h1><p>모임을 선택해 공지와 공식 소속을 함께 관리합니다. 관심 모임 구독과 연도별 목회 조직 편성은 별도로 유지됩니다.</p></div></div><GroupWorkspace canDelete={actor.canDelete===true}/></>;}
