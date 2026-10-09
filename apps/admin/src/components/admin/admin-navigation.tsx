"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Church, FileText, Images, LayoutDashboard, Megaphone, Settings, Video } from 'lucide-react';

const navigation = [
  { label: '관리 홈', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: '설교·첫시간', href: '/admin/worship', icon: Video },
  { label: '공지사항', href: '/admin/notices', icon: Megaphone },
  { label: '주보', href: '/admin/bulletins', icon: FileText },
  { label: '교회 일정', href: '/admin/events', icon: CalendarDays },
  { label: '사진 앨범', href: '/admin/albums', icon: Images },
  { label: '교회 안내', href: '/admin/pages', icon: Church, related: ['/admin/people', '/admin/ministries'] },
  { label: '관리 설정', href: '/admin/manage', icon: Settings, related: ['/admin/settings', '/admin/media', '/admin/admins', '/admin/activity', '/admin/inquiries', '/admin/groups', '/admin/care'] },
];

export function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <ul className="space-y-1">{navigation.map(({ label, href, icon: Icon, related = [] }) => {
    const active = [href, ...related].some(path => pathname === path || pathname.startsWith(path + '/'));
    return <li key={href}><Link href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
      className={`focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${active ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:bg-primary-50 hover:text-primary-700'}`}>
      <Icon aria-hidden="true" className="size-5" />{label}
    </Link></li>;
  })}</ul>;
}
