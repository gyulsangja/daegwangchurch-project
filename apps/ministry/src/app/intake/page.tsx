import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {IntakeWorkspace} from '@/components/intake-workspace';
export default async function Page(){const {actor}=await workspace();if(actor.role!=='ADMIN'||!actor.permissions?.includes('CARE'))redirect('/access-denied');return <><div className="page-heading"><div><h1>문의·돌봄 접수함</h1><p>홈페이지 문의와 앱 상담·심방 요청을 확인하고 처리합니다. 접수 원문은 기존 보관 정책을 따릅니다.</p></div></div><IntakeWorkspace/></>;}
