import Link from 'next/link';
export function ArchivePagination({ page, pageCount, total, filters = {} }: { page: number; pageCount: number; total: number; filters?: Record<string, string | undefined> }) {
  const href = (target: number) => { const query = new URLSearchParams(); for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value); query.set('page', String(target)); return `?${query}`; };
  const style = 'focus-ring inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold';
  return <nav aria-label="목록 페이지" className="mt-6 flex flex-wrap items-center justify-center gap-2">
    {page > 1 && <><Link href={href(1)} className={style}>처음</Link><Link href={href(page - 1)} className={style}>이전</Link></>}
    <span className="px-3 text-sm text-text-secondary">{page} / {pageCount}쪽 · 총 {total.toLocaleString('ko-KR')}개</span>
    {page < pageCount && <><Link href={href(page + 1)} className={style}>다음</Link><Link href={href(pageCount)} className={style}>마지막</Link></>}
  </nav>;
}
