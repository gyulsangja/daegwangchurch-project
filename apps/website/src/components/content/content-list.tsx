import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

import type { ContentListItem } from "@daegwang/contracts/content/content-types";

export function ContentList({ items, basePath }: { items: ContentListItem[]; basePath: string }) {
  if (items.length === 0) {
    return <div className="rounded-2xl border border-border bg-white px-6 py-16 text-center text-text-secondary">표시할 콘텐츠가 없습니다.</div>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card component="article" key={item.slug} className="min-h-64">
          <CardContent className="flex h-full min-h-64 flex-col p-6!">
            <div className="flex items-center justify-between gap-3 text-sm">
              <Chip label={item.category} size="small" color="primary" variant="outlined" />
              <span className="flex items-center gap-1 text-text-secondary"><CalendarDays aria-hidden="true" className="size-4" />{item.date}</span>
            </div>
            <h2 className="mt-6 text-xl font-extrabold tracking-[-0.03em]">{item.title}</h2>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">{item.summary}</p>
            <Link href={`${basePath}/${item.slug}`} className="focus-ring mt-auto inline-flex min-h-11 items-center gap-2 rounded-full pt-5 font-bold text-primary-700">
              자세히 보기 <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
