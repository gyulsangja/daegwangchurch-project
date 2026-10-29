import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {SiteSettingsWorkspace} from '@/components/site-settings-workspace';
export default async function Page(){const {actor}=await workspace();if(!['ADMIN','CONTENT'].includes(actor.role))redirect('/access-denied');return <><div className="page-heading"><div><h1>홈페이지·앱 기본 정보</h1><p>주소·연락처·지도·헌금 안내를 한 번 저장하면 홈페이지와 앱에 함께 반영됩니다.</p></div></div><SiteSettingsWorkspace/></>;}
