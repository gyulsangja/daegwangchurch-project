import {redirect} from 'next/navigation';
import {workspace} from '@/lib/workspace';
import {PastoralWorkspace} from './pastoral-workspace';
const titles={CARE:['상담·심방','상담·심방을 한 번 등록하고 같은 기록에 진행 내용과 결과를 이어서 남깁니다.'],PRAYER:['목회 기도','교회를 위한 기도와 돌아본 이야기를 차곡차곡 남깁니다.'],GOAL:['목회 계획','바라는 변화에서 구체적인 실행으로, 수행 후 돌아보기까지.']};
export async function PastoralPage({mode,initialId,initialMember}:{mode:'CARE'|'PRAYER'|'GOAL';initialId?:string;initialMember?:string}){
 const {service,actor,config}=await workspace();if(!actor.permissions?.includes('CARE'))redirect('/access-denied');const [memberRows,familyRows,catalogs,items,care]=await Promise.all([service.families.candidates(actor),service.families.list(actor),service.years.targets(actor),service.pastoral.list(actor),mode==='CARE'?service.records.careHistory(actor):Promise.resolve([])]);
 const members=memberRows.map(m=>({id:m.id,name:m.name}));
 const families=familyRows.map(f=>({id:f.id,name:f.name,memberIds:f.members.map(m=>m.memberId)}));
 return <><div className="page-heading"><div><p className="eyebrow">목회 수첩</p><h1>{titles[mode][0]}</h1><p>{titles[mode][1]}</p></div></div>{mode==='PRAYER'&&<p className="feedback">목회 담당자가 작성하는 기록입니다. 성도 앱의 개인 기도·묵상은 가져오거나 공개하지 않습니다.</p>}<PastoralWorkspace targetOptions={{members,families,years:catalogs,activeYear:config.activeYear}} initialMember={members.some(m=>m.id===initialMember)?initialMember:undefined} initialId={initialId} mode={mode} items={items} members={members} care={care} today={new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'})}/></>;
}
