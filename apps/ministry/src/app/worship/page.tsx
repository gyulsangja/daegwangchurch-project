import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {WorshipWorkspace} from '@/components/worship-workspace';
export default async function Page(){
 const {actor}=await workspace();if(!['ADMIN','CONTENT'].includes(actor.role))redirect('/access-denied');
 return <WorshipWorkspace canManageSessions={actor.role==='ADMIN'} canPrint={actor.canPrint===true} canDelete={actor.canDelete===true}/>;
}
