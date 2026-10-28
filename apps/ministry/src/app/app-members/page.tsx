import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {MemberAccountWorkspace} from '@/components/member-account-workspace';
export default async function Page(){const {actor}=await workspace();if(actor.role!=='ADMIN')redirect('/access-denied');return <><div className="page-heading"><div><h1>앱 회원·교인 승인</h1><p>가입 회원과 교인 확인·직분·앱 소속을 관리합니다. 교적과 로그인 계정은 구분하며 개인 묵상·기도는 열람하지 않습니다.</p></div></div><MemberAccountWorkspace canDelete={actor.canDelete===true}/></>;}
