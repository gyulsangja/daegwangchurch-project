import {pastoralMembers} from '@daegwang/ministry-core/pastoral';
import {MemberPastoral} from '@/components/member-pastoral';
import {AttendanceSummary} from '@/components/attendance-summary';
import { MemberRecords } from '@/components/member-records';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { workspace } from '@/lib/workspace';
import { memberOr404 } from '@/lib/member';
import { memberReturnPath } from '@/lib/return-path';
import { MemberDetail } from '@/components/member-detail';
export default async function Detail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { service, actor, config } = await workspace(); const member = (await memberOr404(service, actor, (await params).id)); const query = await searchParams; const returnTo = memberReturnPath(query.returnTo);
  const canCare=actor.permissions?.includes('CARE')??false;
  const sections=[['profile','교인 정보'],['attendance','출석 현황'],...(actor.role==='LEADER'?[]:[['records','교적 기록']]),...(canCare?[['care','목회 활동']]:[])];
  const requested=query.section??(query.recordKind?'records':'profile');
  const section=sections.some(([id])=>id===requested)?requested:'profile';
  const records=section==='records'?await Promise.all([service.records.list(actor,member.id),service.years.read(actor,config.activeYear)]):null;
  return <><Link href={returnTo} className="back-link">← 교인 목록</Link><div className="page-heading"><div><p className="eyebrow">교인 상세</p><h1>{member.name}</h1><p>{config.positions.find(p => p.code === member.position)?.label ?? '직분 미지정'} · {config.statuses.find(s => s.code === member.status)?.label}</p></div>{actor.role!=='LEADER'&&<Link className="button primary" href={`/members/${member.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}><Pencil size={17} />정보 수정</Link>}</div>{query.saved === '1' && <p role="status" className="feedback">교인 정보를 저장했습니다.</p>}
  <nav className="member-sections" aria-label="교인 상세 메뉴">{sections.map(([id,label])=><Link key={id} href={{pathname:'/members/'+member.id,query:{section:id,returnTo}}} aria-current={section===id?'page':undefined} prefetch={false} scroll={false}>{label}</Link>)}</nav>
  {section==='profile'&&<MemberDetail member={member} config={config}/>}
  {section==='care'&&canCare&&<MemberPastoral items={(await service.pastoral.list(actor)).filter(i=>pastoralMembers(i).includes(member.id))}/>}
  {section==='attendance'&&<div id="attendance"><AttendanceSummary individual entries={await service.records.attendanceHistory(actor,member.id)} members={[{id:member.id,name:member.name}]} today={new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'})}/></div>}
  {records&&<MemberRecords memberId={member.id} records={records[0]} config={config} roles={records[1].roles} courses={records[1].courses} canCare={canCare} initialKind={typeof query.recordKind==='string'?query.recordKind:undefined}/>}</>;
}
