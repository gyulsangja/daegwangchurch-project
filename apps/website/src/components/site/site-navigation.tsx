'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
const items = [
  { label: '교회소개', href: '/about/church', prefix: '/about' },
  { label: '예배와 말씀', href: '/worship/sunday-morning', prefix: '/worship' },
  { label: '교회소식', href: '/news/notices', prefix: '/news' },
  { label: '교회학교', href: '/ministries/elementary', prefix: '/ministries' },
  { label: '새가족 안내', href: '/newcomer/guide', prefix: '/newcomer' },
  { label: '오시는 길', href: '/location', prefix: '/location' },
];
export function SiteNavigation() {
  const pathname = usePathname(); const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (details.current) details.current.open = false; }, [pathname]);
  function links(mobile = false) { return items.map(item => { const active = pathname.startsWith(item.prefix); return <li key={item.href}><Link href={item.href} aria-current={active ? 'page' : undefined} onClick={() => { if (details.current) details.current.open = false; }} className={`focus-ring flex min-h-12 items-center rounded-md px-3 text-[.94rem] font-semibold transition-colors ${mobile ? 'px-4' : ''} ${active ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:bg-primary-50 hover:text-primary-700'}`}>{item.label}</Link></li>; }); }
  return <><nav aria-label="주 메뉴" className="hidden lg:block"><ul className="flex items-center gap-1">{links()}</ul></nav><details ref={details} className="group relative lg:hidden" onKeyDown={event => { if (event.key === 'Escape' && details.current) { details.current.open = false; details.current.querySelector('summary')?.focus(); } }}><summary className="focus-ring flex size-12 cursor-pointer list-none items-center justify-center rounded-full border border-border bg-white [&::-webkit-details-marker]:hidden"><Menu aria-hidden="true" className="size-5 group-open:hidden" /><X aria-hidden="true" className="hidden size-5 group-open:block" /><span className="sr-only">메뉴 열기·닫기</span></summary><nav aria-label="모바일 주 메뉴" className="absolute right-0 top-14 max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-white p-3 shadow-lg"><ul>{links(true)}</ul></nav></details></>;
}
