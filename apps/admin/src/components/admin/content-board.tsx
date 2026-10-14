'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, FileText, ImageIcon, ExternalLink } from 'lucide-react';

export type BoardItem = { id: string; title: string; date: string; status: string; statusLabel: string; category?: string; description?: string; pinned?: boolean; image?: string; file?: string };
export function ContentBoard({ items, kind }: { items: BoardItem[]; kind: 'notices' | 'events' | 'albums' | 'bulletins' }) {
  const [status, setStatus] = useState(''); const [month, setMonth] = useState(''); const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('');
  const visible = useMemo(() => items.filter(item => (!status || item.status === status) && (!month || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit' }).format(new Date(item.date)).startsWith(month)) && (!category || item.category === category)).sort((a, b) => {
    if (kind === 'notices' && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === 'title') return a.title.localeCompare(b.title, 'ko');
    return (new Date(b.date).getTime() - new Date(a.date).getTime()) * (sort === 'oldest' ? -1 : 1);
  }), [items, status, month, category, sort, kind]);
  const field = 'min-h-11 rounded-lg border border-border bg-white px-3 text-sm';
  const date = (value: string) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  return <div className="mt-4">
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-background-muted p-3">
      <label className="grid gap-1 text-xs font-semibold">공개 상태<select className={field} value={status} onChange={e => setStatus(e.target.value)}><option value="">전체 상태</option>{Array.from(new Map(items.map(item => [item.status, item.statusLabel]))).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {kind !== 'notices' && <label className="grid gap-1 text-xs font-semibold">{kind === 'bulletins' ? '예배 월' : '행사 월'}<input type="month" className={field} value={month} onChange={e => setMonth(e.target.value)} /></label>}
      {items.some(item => item.category) && <label className="grid gap-1 text-xs font-semibold">분류<select className={field} value={category} onChange={e => setCategory(e.target.value)}><option value="">전체 분류</option>{Array.from(new Set(items.map(item => item.category).filter(Boolean))).map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
      <label className="grid gap-1 text-xs font-semibold">정렬<select className={field} value={sort} onChange={e => setSort(e.target.value)}><option value="newest">날짜 최신순</option><option value="oldest">날짜 오래된순</option><option value="title">제목 가나다순</option></select></label>
      <button type="button" className="min-h-11 px-3 text-sm font-semibold" onClick={() => { setStatus(''); setMonth(''); setCategory(''); setSort('newest'); }}>필터 초기화</button>
    </div>
    <p className="my-3 text-sm text-text-secondary" aria-live="polite">불러온 {items.length}개 중 {visible.length}개 표시{kind === 'notices' ? ' · 고정 공지가 먼저 표시됩니다.' : ''}</p>
    {!visible.length && <p className="rounded-xl border border-border p-8 text-center text-text-secondary">표시할 게시물이 없습니다. 검색어나 필터를 확인해 주세요.</p>}
    <div className={kind === 'albums' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'divide-y divide-border rounded-xl border border-border bg-white'}>
      {visible.map(item => <article key={item.id} className={kind === 'albums' ? 'overflow-hidden rounded-xl border border-border bg-white' : 'flex items-start gap-3 p-4 md:items-center md:gap-5'}>
        {kind === 'albums' ? <Link href={`/admin/albums/${item.id}/edit`} aria-label={`${item.title} 수정`} className="relative flex aspect-[4/3] items-center justify-center bg-background-muted">{item.image ? <Image src={item.image} alt="" fill sizes="(min-width:1280px) 30vw, 50vw" className="object-cover" /> : <ImageIcon aria-hidden="true" className="size-10 text-text-secondary" />}</Link> : kind !== 'notices' ? <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-background-muted p-2 text-primary-700">{kind === 'bulletins' ? <FileText aria-hidden="true" className="size-5" /> : <CalendarDays aria-hidden="true" className="size-5" />}<span className="mt-1 text-sm font-bold">{new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' }).format(new Date(item.date))}</span></div> : null}
        <div className={kind === 'albums' ? 'p-4' : 'min-w-0 flex-1'}><div className="mb-1 flex flex-wrap gap-2 text-xs"><span className={item.status === 'PUBLISHED' ? 'font-semibold text-primary-700' : 'font-semibold text-text-secondary'}>{item.statusLabel}</span>{item.pinned && <span className="font-bold text-primary-700">고정</span>}{item.category && <span>{item.category}</span>}</div>
          <Link href={`/admin/${kind}/${item.id}/edit`} className="inline-flex min-h-11 items-center break-words font-bold leading-relaxed hover:text-primary-700 hover:underline">{item.title}</Link>
          <p className="text-sm leading-6 text-text-secondary">{date(item.date)}{item.description ? ` · ${item.description}` : ''}</p>
          {item.file && <a href={item.file} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary-700">PDF 열기<ExternalLink aria-hidden="true" className="size-3" /></a>}
        </div>
        <Link href={`/admin/${kind}/${item.id}/edit`} className={kind === 'albums' ? 'flex min-h-11 items-center justify-center border-t border-border text-sm font-semibold text-primary-700' : 'inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-semibold text-primary-700'} aria-label={`${item.title} 수정`}>수정</Link>
      </article>)}
    </div>
  </div>;
}
