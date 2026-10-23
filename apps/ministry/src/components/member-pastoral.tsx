import Link from 'next/link';
import type {PastoralItem} from '@daegwang/ministry-core/pastoral';
export function MemberPastoral({items}:{items:PastoralItem[]}){
 if(!items.length)return null;
 const links={CARE:'/care',PRAYER:'/prayers',GOAL:'/plans',PLAN:'/plans'};
 const labels={CARE:'상담·심방',PRAYER:'목회 기도',GOAL:'목회 목표',PLAN:'실행 계획'};
 return <section className="panel detail-body"><h2>이 교인과 이어지는 목회 기록</h2><p className="muted">목회 수첩에 연결한 일정과 기도입니다. 돌봄 권한이 있는 담당자에게만 표시됩니다.</p><ul className="history-list">{items.map(item=><li key={item.id}><Link className="text-link" href={links[item.kind]}>{item.title} →</Link><small>{labels[item.kind]} · {item.date} · {item.status==='OPEN'?'진행 중':item.status==='DONE'?'마무리':'보관'}</small><details><summary>수행 기록 보기</summary>{item.history.map((h,index)=><p className="preserve-lines" key={index}>{h.at.slice(0,10)} · {h.note}</p>)}</details></li>)}</ul></section>;
}
