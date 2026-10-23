import {workspace} from '@/lib/workspace';
import {PastoralWorkspace} from './pastoral-workspace';
const titles={CARE:['상담·심방','만남을 준비하고, 돌봄이 이어지도록 기록합니다.'],PRAYER:['목회 기도','교회를 위한 기도와 돌아본 이야기를 차곡차곡 남깁니다.'],GOAL:['목표와 계획','바라는 변화에서 구체적인 실행으로, 수행 후 돌아보기까지.']};
export async function PastoralPage({mode}:{mode:'CARE'|'PRAYER'|'GOAL'}){
 const {service,actor}=await workspace();const members=service.families.candidates(actor).map(m=>({id:m.id,name:m.name}));
 return <><div className="page-heading"><div><p className="eyebrow">목회 수첩</p><h1>{titles[mode][0]}</h1><p>{titles[mode][1]}</p></div></div>{mode==='PRAYER'&&<p className="feedback">목회 담당자가 작성하는 기록입니다. 성도 앱의 개인 기도·묵상은 가져오거나 공개하지 않습니다.</p>}<PastoralWorkspace mode={mode} items={service.pastoral.list(actor)} members={members} care={mode==='CARE'?service.records.careHistory(actor):[]} today={new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'})}/></>;
}
