"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId } from 'react';
import { ChevronDown, Church, LayoutDashboard, Megaphone, UsersRound, Video } from 'lucide-react';
export type AdminNavigationAccess = { superAdmin?: boolean; groupsEnabled?: boolean; careEnabled?: boolean };
const content = [
  { label: '말씀·주보', icon: Video, items: [{label:'설교·첫시간',href:'/admin/worship'}, {label:'주보',href:'/admin/bulletins'}] },
  { label: '교회 소식', icon: Megaphone, items: [{label:'공지사항',href:'/admin/notices'}, {label:'교회 일정',href:'/admin/events'}, {label:'사진 앨범',href:'/admin/albums'}] },
];
export function AdminNavigation({ onNavigate, superAdmin = false, groupsEnabled = false, careEnabled = false }: AdminNavigationAccess & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const sectionGroup = useId();
  const sections = [...content,
    {label:'교인·모임',icon:UsersRound,items:[...(superAdmin?[{label:'회원 관리',href:'/admin/members'},{label:'방문 문의',href:'/admin/inquiries'}]:[]),...(groupsEnabled?[{label:'모임·소속 관리',href:'/admin/groups'}]:[]),...(careEnabled?[{label:'상담·심방',href:'/admin/care'}]:[])]},
    {label:'교회·설정',icon:Church,items:[{label:'교회 안내',href:'/admin/pages',related:['/admin/people','/admin/ministries']},{label:'교회 기본 정보',href:'/admin/settings'},{label:'관리 도구',href:'/admin/manage',related:['/admin/media','/admin/admins','/admin/activity']}]},
  ];
  const active = (item: {href:string;related?:string[]}) => [item.href,...(item.related??[])].some(path=>pathname===path||pathname.startsWith(path+'/'));
  return <div className="space-y-2"><Link href="/admin/dashboard" onClick={onNavigate} aria-current={pathname==='/admin/dashboard'?'page':undefined} className={`focus-ring flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${pathname==='/admin/dashboard'?'bg-primary-50 text-primary-700':'text-text-secondary hover:bg-background-muted'}`}><LayoutDashboard aria-hidden="true" className="size-5" />관리 홈</Link>
    {sections.filter(section=>section.items.length).map(({label,icon:Icon,items})=><details key={`${label}-${pathname}`} name={sectionGroup} open={items.some(active)} className="group/nav rounded-xl" >
      <summary className={`focus-ring flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 text-sm font-bold [&::-webkit-details-marker]:hidden ${items.some(active)?'text-primary-700':'text-text-secondary hover:bg-background-muted'}`}><Icon aria-hidden="true" className="size-5" /><span className="flex-1">{label}</span><ChevronDown aria-hidden="true" className="size-4 transition-transform group-open/nav:rotate-180" /></summary>
      <ul className="mb-2 ml-5 space-y-1 border-l border-border pl-3">{items.map(item=><li key={item.href}><Link href={item.href} onClick={onNavigate} aria-current={active(item)?'page':undefined} className={`focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm ${active(item)?'bg-primary-50 font-bold text-primary-700':'text-text-secondary hover:bg-background-muted'}`}>{item.label}</Link></li>)}</ul>
    </details>)}
  </div>;
}
