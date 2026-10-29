import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {PageWorkspace} from '@/components/page-workspace';
export default async function Page(){const {actor}=await workspace();if(actor.role!=='ADMIN')redirect('/access-denied');return <><div className="page-heading"><div><h1>홈페이지 안내 문구</h1><p>메인 인사·교회소개·비전·새가족 교육 안내를 관리합니다. 주보·말씀·공지 원본은 각각의 통합 메뉴에서 등록합니다.</p></div></div><PageWorkspace/></>;}
