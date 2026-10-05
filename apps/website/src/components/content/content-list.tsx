import { ArrowRight, CalendarDays, BookOpenText } from "lucide-react";
import Link from "next/link";

import type { ContentListItem } from "@daegwang/contracts/content/content-types";

export function ContentList({ items, basePath }: { items: ContentListItem[]; basePath: string }) {
  if (items.length === 0) {
    return <div className="rounded-xl border border-border bg-background-warm px-6 py-14 text-center"><BookOpenText aria-hidden="true" className="mx-auto mb-4 size-9 text-primary-600" strokeWidth={1.3} /><p className="font-semibold">아직 등록된 소식이 없습니다.</p><p className="mt-2 text-sm leading-7 text-text-secondary">새로운 소식이 등록되면 이곳에서 확인하실 수 있습니다.</p></div>;
  }

  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <article key={item.slug} className="grid gap-4 py-7 md:grid-cols-[10rem_1fr] md:gap-8">
            <div className="flex flex-wrap items-center gap-3 text-sm md:flex-col md:items-start">
              <span className="rounded-md bg-primary-50 px-3 py-1 font-semibold text-primary-700">{item.category}</span>
              <span className="flex items-center gap-1 text-text-secondary"><CalendarDays aria-hidden="true" className="size-4" />{item.date}</span>
            </div>
            <div><h2 className="text-xl font-semibold leading-relaxed"><Link href={`${basePath}/${item.slug}`} className="focus-ring rounded hover:text-primary-700">{item.title}</Link></h2>
            <p className="mt-3 line-clamp-2 leading-7 text-text-secondary">{item.summary}</p>
            <Link href={`${basePath}/${item.slug}`} aria-label={`${item.title} 자세히 보기`} className="church-text-link mt-3">자세히 보기 <ArrowRight aria-hidden="true" className="size-4" /></Link></div>
        </article>
      ))}
    </div>
  );
}
