import { notFound } from 'next/navigation';
import { workspace } from '@/lib/workspace';
import { isDirectoryError } from '@daegwang/ministry-core/directory';
import { YearSettings } from '@/components/year-settings';
export default async function Settings({ searchParams }: { searchParams: Promise<{ year?: string; tab?: string; member?: string; organization?:string }> }) {
  const { service, actor, config } = await workspace();
  const query = await searchParams; const year = query.year === undefined ? config.activeYear : Number(query.year);
  let period;
  try { period = (await service.years.read(actor, year)); } catch (e) { if (isDirectoryError(e) && e.code === 'NOT_FOUND') notFound(); throw e; }
  const years = (await service.years.list(actor));
  const members = await service.options(actor);
  return <><div className="page-heading"><div><p className="eyebrow">교회 운영 기준</p><h1>환경설정</h1><p>직분·조직·전도회 구성과 임원 역할을 연도별로 관리합니다.</p></div></div><YearSettings key={`${year}-${period.version}-${query.tab}-${query.organization}-${query.member}`} period={period} years={years} members={members.map(m => ({ id: m.id, name: m.name }))} activeYear={config.activeYear} initialTab={query.tab} initialMember={query.member} initialOrganization={query.organization} /></>;
}
