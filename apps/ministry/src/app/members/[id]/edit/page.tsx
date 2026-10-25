import Link from 'next/link';
import { workspace } from '@/lib/workspace';
import { memberOr404 } from '@/lib/member';
import { memberReturnPath } from '@/lib/return-path';
import { MemberForm } from '@/components/member-form';
export default async function Edit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { service, actor, config } = await workspace(); const member = (await memberOr404(service, actor, (await params).id)); const returnTo = memberReturnPath((await searchParams).returnTo);
  return <><Link href={`/members/${member.id}?returnTo=${encodeURIComponent(returnTo)}`} className="back-link">← 교인 상세</Link><div className="page-heading"><div><p className="eyebrow">교적 관리</p><h1>교인 정보 수정</h1><p>{member.name}님의 기본정보와 소속을 수정합니다.</p></div></div><MemberForm key={`${member.id}-${member.version}`} config={config} member={member} returnTo={returnTo} /></>;
}
