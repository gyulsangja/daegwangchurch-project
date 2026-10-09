"use client";

import { useRef } from 'react';
import { Menu } from 'lucide-react';
import { AdminNavigation } from './admin-navigation';

export function AdminMobileMenu() {
  const menu = useRef<HTMLDetailsElement>(null);
  return <details ref={menu} className="group relative lg:hidden">
    <summary className="focus-ring flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-border [&::-webkit-details-marker]:hidden">
      <Menu aria-hidden="true" className="size-5" /><span className="sr-only">관리자 메뉴 열기</span>
    </summary>
    <nav aria-label="모바일 관리자 메뉴" className="absolute left-0 top-14 max-h-[75dvh] w-64 overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-xl">
      <AdminNavigation onNavigate={() => { if (menu.current) menu.current.open = false; }} />
    </nav>
  </details>;
}
