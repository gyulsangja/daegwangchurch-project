import Link from 'next/link';
import {pastoralMembers,type PastoralItem} from '@daegwang/ministry-core/pastoral';
export function ActivityLinks({item,members}:{item:PastoralItem;members:{id:string;name:string}[]}){
 const ids=pastoralMembers(item);const people=<div className="chips">{ids.map(id=><Link key={id} className="text-link" href={`/members/${id}`}>{members.find(m=>m.id===id)?.name??'교인'} →</Link>)}</div>;
 return <><div className="chips">{item.targets?.families.map(f=><Link className="chip" key={f.id} href={`/families?family=${f.id}`}>가구 · {f.name}</Link>)}{item.targets?.organizations.map(o=><Link className="chip" key={`${o.year}-${o.id}`} href={`/organizations?year=${o.year}&organizationId=${o.id}`}>조직 · {o.year} {o.name}</Link>)}</div>{ids.length>3?<details><summary>연결 교적 {ids.length}명</summary>{people}</details>:people}</>;
}
