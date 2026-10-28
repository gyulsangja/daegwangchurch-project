import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {WorshipWorkspace} from '@/components/worship-workspace';
export default async function Page(){
 const {actor}=await workspace();if(actor.role!=='ADMIN')redirect('/access-denied');
 return <><div className="page-heading"><div><h1>예배·말씀 자료</h1><p>홈페이지·앱의 주보와 말씀을 한곳에서 찾아 연결합니다.</p></div></div><WorshipWorkspace canPrint={actor.canPrint===true}/></>;
}
