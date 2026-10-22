import {workspace} from '@/lib/workspace';
import {FamilyWorkspace} from '@/components/family-workspace';
export default async function Families({searchParams}:{searchParams:Promise<{family?:string;member?:string}>}){
 const {service,actor}=await workspace();const query=await searchParams;
 return <><div className="page-heading"><div><p className="eyebrow">함께 돌보는 가정</p><h1>가구 관리</h1><p>가구별 교인을 연결하고 가족 관계를 관리합니다. 교인 한 명만으로도 가구를 만들 수 있습니다.</p></div></div><FamilyWorkspace key={`${query.family}-${query.member}`} families={service.families.list(actor)} candidates={service.families.candidates(actor)} initialId={query.family} initialMember={query.member}/></>;
}
