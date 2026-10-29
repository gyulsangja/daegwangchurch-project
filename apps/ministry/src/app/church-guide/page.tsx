import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {GuideWorkspace} from '@/components/guide-workspace';
export default async function Page(){const {actor}=await workspace();if(!['ADMIN','CONTENT'].includes(actor.role))redirect('/access-denied');return <><div className="page-heading"><div><h1>교회 안내 관리</h1><p>예배 시간, 섬기는 사람들과 부서 소개, 연혁을 관리합니다.</p></div></div><GuideWorkspace canDelete={!!actor.canDelete}/></>;}
