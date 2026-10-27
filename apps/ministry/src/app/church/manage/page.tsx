import Link from 'next/link';
import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {ChurchContentEditor} from '@/components/church-content-editor';
export default async function Page(){
 const {actor}=await workspace();if(!['ADMIN','CONTENT'].includes(actor.role))redirect('/access-denied');
 return <><div className="page-heading"><div><h1>일정·공지 관리</h1><p>기존 홈페이지·앱 게시물을 같은 원본으로 관리합니다.</p></div><Link href="/church" className="button">일정·공지로 돌아가기</Link></div><ChurchContentEditor/></>;
}
