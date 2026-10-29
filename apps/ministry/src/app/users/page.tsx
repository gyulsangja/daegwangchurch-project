import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {authenticatedSession} from '@/lib/auth-security';
import {accessEnabled,listAccess} from '@/lib/access-management';
import {AccessWorkspace} from '@/components/access-workspace';
import {operationalEnabled} from '@/lib/operational-config';
import {accessReview} from '@/lib/access-review';
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const initialQuery=(await searchParams).q?.slice(0,254)??'';const {actor,config}=await workspace();if(actor.role!=='ADMIN')redirect('/access-denied');
 if(!operationalEnabled()&&process.env.MINISTRY_TEST_MODE==='true')return <AccessWorkspace initialQuery={initialQuery} contentRoleEnabled={process.env.MINISTRY_CONTENT_ROLE_ENABLED==='true'} data={accessReview} currentUser={accessReview.users[0].id} organizations={config.organizations} year={config.activeYear}/>;
 if(!accessEnabled())return <section className="panel detail-body"><h1>사용자 및 권한</h1><p>권한 관리 DB 연결 준비가 필요합니다. 기존 로그인과 교적은 그대로 유지됩니다.</p><p>준비가 완료되면 이 화면에서 사용자 초대, 담당 업무와 조직 지정, 이용 중지, 변경 이력을 관리할 수 있습니다.</p></section>;
 const {user,aal,nextLevel}=await authenticatedSession();if(nextLevel==='aal2'&&aal!=='aal2')redirect('/account/security');
 return <AccessWorkspace initialQuery={initialQuery} contentRoleEnabled={process.env.MINISTRY_CONTENT_ROLE_ENABLED==='true'} requiresPassword={aal!=='aal2'} data={await listAccess(user.id,aal)} currentUser={user.id} organizations={config.organizations} year={config.activeYear}/>;
}
