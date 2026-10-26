import Link from 'next/link';
import {pastoralPeriod,scopeLabels} from '@daegwang/ministry-core/pastoral';
import type {PastoralItem} from '@daegwang/ministry-core/pastoral';
export function MemberPastoral({items,title='이 교인과 이어지는 목회 기록'}:{items:PastoralItem[];title?:string}){
 if(!items.length)return null;
 const links={CARE:'/care',PRAYER:'/prayers',GOAL:'/plans',PLAN:'/plans'};
 const labels={CARE:'상담·심방',PRAYER:'목회 기도',GOAL:'목회 계획',PLAN:'실천 활동'};
 return <section className="panel detail-body"><h2>{title}</h2><p className="muted">목회 수첩에 연결한 일정과 기도입니다. 돌봄 권한이 있는 담당자에게만 표시됩니다.</p><ul className="history-list">{items.map(item=><li key={item.id}><Link className="text-link" href={`${links[item.kind]}?activity=${encodeURIComponent(item.id)}`}>{item.title} →</Link><small>{labels[item.kind]} · {scopeLabels[item.scope??'ONCE']} · {pastoralPeriod(item)} · {item.status==='OPEN'?'진행 중':item.status==='DONE'?'마무리':'보관'}</small><details><summary>내용·수행 기록 보기</summary><p className="preserve-lines">{item.body}</p>{item.history.map((h,index)=><p className="preserve-lines" key={index}>{h.date??h.at.slice(0,10)} · {h.note}</p>)}</details></li>)}</ul></section>;
}
