import Link from 'next/link';
import { UserPlus, Search } from 'lucide-react';
import { memberSearchSchema } from '@daegwang/contracts/ministry';
import { workspace } from '@/lib/workspace';
import { MemberList } from '@/components/member-list';
export default async function Members({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { service, actor, config } = await workspace();
  const parsed = memberSearchSchema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : memberSearchSchema.parse({});
  const data = service.list(actor, query);
  const qs = new URLSearchParams({ q: query.q, status: query.status, organizationId: query.organizationId, page: String(query.page) });
  const returnTo = `/members?${qs}`;
  const pageLink = (page: number) => { const next = new URLSearchParams(qs); next.set('page', String(page)); return `/members?${next}`; };
  return <><div className="page-heading"><div><p className="eyebrow">교적 관리</p><h1>교인</h1><p>이름과 소속으로 찾고, 필요한 정보를 확인하세요.</p></div><Link href="/members/new" className="button primary"><UserPlus size={18} />교인 등록</Link></div>{!parsed.success && <p role="status" className="feedback">검색 조건이 올바르지 않아 전체 목록을 표시합니다.</p>}<section className="panel"><form action="/members" className="filters"><label className="search-field"><span>이름</span><div><Search size={17} aria-hidden="true" /><input name="q" defaultValue={query.q} placeholder="이름 검색" maxLength={80} /></div></label><label><span>교적 상태</span><select name="status" defaultValue={query.status}><option value="">전체 상태</option>{config.statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}</select></label><label><span>소속</span><select name="organizationId" defaultValue={query.organizationId}><option value="">전체 소속</option>{config.organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label><button className="button primary">검색</button><Link href="/members" className="text-link">초기화</Link></form><div className="list-meta"><span>검색 결과 <strong>{data.total}명</strong></span><span>이름순 · 연락처는 상세에서 확인</span></div><MemberList rows={data.items} config={config} returnTo={returnTo} /><nav className="pagination" aria-label="교인 목록 페이지">{query.page > 1 && <Link className="button" href={pageLink(query.page - 1)}>이전</Link>}<span>{query.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))} 페이지</span>{query.page * data.pageSize < data.total && <Link className="button" href={pageLink(query.page + 1)}>다음</Link>}</nav></section></>;
}
