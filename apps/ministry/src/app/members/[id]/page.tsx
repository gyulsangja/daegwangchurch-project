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
  return <><Link href={returnTo} className="back-link">← 교인 목록</Link><div className="page-heading"><div><p className="eyebrow">교인 상세</p><h1>{member.name}</h1><p>{config.positions.find(p => p.code === member.position)?.label ?? '직분 미지정'} · {config.statuses.find(s => s.code === member.status)?.label}</p></div><Link className="button primary" href={`/members/${member.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}><Pencil size={17} />정보 수정</Link></div>{query.saved === '1' && <p role="status" className="feedback">개발용 교인 정보를 저장했습니다.</p>}<MemberDetail member={member} config={config} />{actor.permissions?.includes('CARE')&&<MemberPastoral items={(await service.pastoral.list(actor)).filter(i=>pastoralMembers(i).includes(member.id))}/>}<div id="attendance"><AttendanceSummary individual entries={(await service.records.attendanceHistory(actor,member.id))} members={[{id:member.id,name:member.name}]} today={new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'})}/></div><MemberRecords memberId={member.id} records={(await service.records.list(actor, member.id))} config={config} roles={(await service.years.read(actor, config.activeYear)).roles} initialKind={typeof query.recordKind === 'string' ? query.recordKind : undefined} courses={(await service.years.read(actor, config.activeYear)).courses} canCare={actor.permissions?.includes('CARE') ?? false}/></>;
}
