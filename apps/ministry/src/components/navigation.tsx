'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Church, Home, Users, Network, Settings2 } from 'lucide-react';
const items = [{ href: '/', label: '홈', Icon: Home }, { href: '/members', label: '교인', Icon: Users }, { href: '/organizations', label: '조직', Icon: Network }, { href: '/settings', label: '환경설정', Icon: Settings2 }];
export function Navigation({ name = '대광교회' }: {name?:string}) {
  const pathname = usePathname();
  return <aside className="sidebar"><Link href="/" className="brand"><Church size={28} strokeWidth={1.5} /><span><small>대한예수교장로회</small><strong>{name}</strong></span></Link><div className="workspace-label">목회시스템</div><nav aria-label="주요 메뉴">{items.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)) ? 'page' : undefined}><Icon size={19} />{label}</Link>)}</nav><p className="sidebar-note">한 사람의 이야기를<br />함께 기억하는 교회</p></aside>;
}
