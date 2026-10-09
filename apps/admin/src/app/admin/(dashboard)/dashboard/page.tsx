import Link from 'next/link';
import { ContentHome } from '../../../../components/admin/content-home';
import { getDashboardSummary } from '@daegwang/server/features/dashboard/queries';
import { getOpenInquiryCount } from '@daegwang/server/features/inquiries/queries';
import { requireAdmin } from '../../../../lib/auth/permissions';

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const [summary, inquiries] = await Promise.all([
    getDashboardSummary(),
    admin.role === 'SUPER_ADMIN' ? getOpenInquiryCount() : Promise.resolve(0),
  ]);
  const recent = [
    { label: '주일 설교', value: summary.latestSunday, href: '/admin/worship' },
    { label: '첫시간 주님께', value: summary.latestFirstHour, href: '/admin/worship' },
    { label: '공지사항', value: summary.latestNotice, href: '/admin/notices' },
    { label: '주보', value: summary.latestBulletin, href: '/admin/bulletins' },
    { label: '예정 일정', value: summary.nextEvent, href: '/admin/events' },
  ];
  return <div className="mx-auto max-w-5xl">
    <ContentHome />
    {inquiries > 0 && <Link href="/admin/inquiries" className="focus-ring mt-6 block rounded-xl border border-primary-200 bg-primary-50 p-4 font-semibold text-primary-700">확인이 필요한 방문 문의 {inquiries}건 →</Link>}
    <section aria-labelledby="recent-title" className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-7">
      <h2 id="recent-title" className="text-xl font-bold">최근 등록한 내용</h2>
      <p className="mt-2 text-sm text-text-secondary">임시저장도 포함합니다. 항목을 눌러 내용을 확인하거나 수정하세요.</p>
      {summary.unavailable ? <p role="status" className="mt-5 text-text-secondary">최근 내용을 불러오지 못했습니다. 각 메뉴에서 다시 확인해 주세요.</p> : <ul className="mt-4 divide-y divide-border">{recent.map(item => <li key={item.label}>
        <Link href={item.href} className="focus-ring flex flex-col gap-2 py-4 sm:flex-row sm:items-center"><span className="w-32 shrink-0 font-semibold">{item.label}</span><span className="min-w-0 flex-1 break-words text-sm text-text-secondary">{item.value}</span><span aria-hidden="true" className="hidden text-primary-700 sm:block">→</span></Link>
      </li>)}</ul>}
    </section>
  </div>;
}
