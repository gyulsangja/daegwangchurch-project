import Link from 'next/link';
import { Network } from 'lucide-react';
import { workspace } from '@/lib/workspace';
import { MemberList } from '@/components/member-list';
export default async function Organizations({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  const { service, actor, config } = await workspace(); const requested = (await searchParams).organizationId; const selected = config.organizations.find(o => o.id === requested) ?? config.organizations[0];
  const data = selected ? (await service.list(actor, { organizationId: selected.id })) : null;
  return <><div className="page-heading"><div><p className="eyebrow">함께하는 공동체</p><h1>조직</h1><p>조직을 선택해 구성원을 확인하세요. 현재 이름과 구성은 가상 예시입니다.</p></div></div><div className="org-layout"><nav className="panel org-nav" aria-label="조직 선택"><h2>조직 목록</h2>{config.organizations.map(o => <Link key={o.id} href={`/organizations?organizationId=${o.id}`} aria-current={o.id === selected?.id ? 'page' : undefined}><Network size={17} />{o.name}</Link>)}</nav><section className="panel"><div className="section-heading"><div><h2>{selected?.name ?? '등록된 조직 없음'}</h2><p>구성원 {data?.total ?? 0}명</p></div>{selected && <Link className="button primary" href={`/settings?tab=${encodeURIComponent('구성원 배정')}&organization=${selected.id}`}>구성원·임원 배정 →</Link>}</div>{data && <MemberList rows={data.items} config={config} returnTo={`/members?organizationId=${selected.id}`} />}</section></div><p className="muted">{config.activeYear}년 운영 조직입니다. <Link href="/settings">연도별 조직 구성·역할 배정 →</Link></p></>;
}
