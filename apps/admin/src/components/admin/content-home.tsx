import Link from 'next/link';
import { CalendarDays, FileText, Megaphone, Video } from 'lucide-react';

const actions = [
  { title: '설교 올리기', href: '/admin/worship/new?type=SUNDAY_MORNING', icon: Video },
  { title: '첫시간 올리기', href: '/admin/worship/new?type=FIRST_HOUR', icon: Video },
  { title: '공지 쓰기', href: '/admin/notices/new', icon: Megaphone },
  { title: '주보 올리기', href: '/admin/bulletins/new', icon: FileText },
];

export function ContentHome({ preview = false }: { preview?: boolean }) {
  return <section aria-labelledby="content-home-title">
    <p className="text-sm font-semibold text-primary-700">홈페이지·앱 통합 관리</p>
    <h1 id="content-home-title" className="mt-2 text-3xl font-extrabold">관리 홈</h1>
    <p className="mt-3 leading-7 text-text-secondary">한 번 올리면 홈페이지와 앱에 함께 보입니다. 수정과 비공개도 같은 곳에서 관리하세요.</p>
    <div className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">{actions.map(({ title, href, icon: Icon }) => {
      const content = <><Icon aria-hidden="true" className="size-6 text-primary-700" /><span className="font-bold">{title}</span></>;
      const className = 'focus-ring flex min-h-28 flex-col justify-center gap-3 rounded-2xl border border-border bg-white p-5 hover:border-primary-500';
      return preview ? <div key={href} className={className}>{content}</div> : <Link key={href} href={href} className={className}>{content}</Link>;
    })}</div>
    {!preview && <Link href="/admin/events/new" className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-700"><CalendarDays aria-hidden="true" className="size-4" />교회 일정 등록</Link>}
  </section>;
}
