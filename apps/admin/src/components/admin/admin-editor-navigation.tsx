'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
const sections = ['worship', 'notices', 'bulletins', 'events', 'albums', 'people', 'ministries', 'pages/history', 'pages/worship-info'];
export function AdminEditorNavigation() {
  const pathname = usePathname();
  const section = sections.find(value => pathname.startsWith(`/admin/${value}/`) && (pathname.endsWith('/edit') || pathname.endsWith('/new')));
  if (!section) return null;
  return <nav aria-label="게시물 작업" className="mx-auto mb-5 flex max-w-[90rem] flex-wrap items-center justify-between gap-3 text-sm font-bold">
    <Link href={`/admin/${section}`} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-primary-700 hover:bg-primary-50"><ArrowLeft className="size-4" aria-hidden="true" />목록으로</Link>
    {pathname.endsWith('/edit') && <Link href={`/admin/${section}/new`} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-primary-700 hover:bg-primary-50"><Plus className="size-4" aria-hidden="true" />새로 등록</Link>}
  </nav>;
}
