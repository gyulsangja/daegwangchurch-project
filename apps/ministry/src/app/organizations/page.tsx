import Link from 'next/link';
import { Network } from 'lucide-react';
import { workspace } from '@/lib/workspace';
import { MemberList } from '@/components/member-list';
export default async function Organizations({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  const { service, actor, config } = await workspace(); const requested = (await searchParams).organizationId; const selected = config.organizations.find(o => o.id === requested) ?? config.organizations[0];
  const data = selected ? service.list(actor, { organizationId: selected.id }) : null;
  return <><div className="page-heading"><div><p className="eyebrow">함께하는 공동체</p><h1>조직</h1><p>조직을 선택해 구성원을 확인하세요. 현재 이름과 구성은 가상 예시입니다.</p></div></div><div className="org-layout"><nav className="panel org-nav" aria-label="조직 선택"><h2>조직 목록</h2>{config.organizations.map(o => <Link key={o.id} href={`/organizations?organizationId=${o.id}`} aria-current={o.id === selected?.id ? 'page' : undefined}><Network size={17} />{o.name}</Link>)}</nav><section className="panel"><div className="section-heading"><div><h2>{selected?.name ?? '등록된 조직 없음'}</h2><p>구성원 {data?.total ?? 0}명</p></div>{selected && <Link className="text-link" href={`/members?organizationId=${selected.id}`}>전체 구성원 보기 →</Link>}</div>{data && <MemberList rows={data.items} config={config} returnTo={`/members?organizationId=${selected.id}`} />}</section></div><p className="muted">소속 배정은 교인 정보 수정에서 할 수 있습니다. 조직 편집과 담당자 지정은 실제 조직 기준을 확인한 후 연결합니다.</p></>;
}
