import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { ArrowRight, CalendarDays, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ContentShell } from "../site/content-shell";
import { PageHero } from "../site/page-hero";
import { Button } from "@daegwang/web-ui/components/ui/button";

type AlbumListItem = { slug: string; title: string; category: string; date: string; description: string; imageCount: number; coverUrl: string };

export function AlbumListPage({ items, query }: { items: AlbumListItem[]; query: string }) {
  return (
    <>
      <PageHero eyebrow="ALBUM" title="행사앨범" description="대광교회 공동체의 소중한 순간을 나눕니다." />
      <ContentShell>
        <Paper variant="outlined" className="mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-text-secondary">총 {items.length}개 앨범</p>
          <form className="flex gap-2"><TextField name="q" defaultValue={query} size="small" label="앨범 검색" placeholder="제목 또는 분류" className="w-full sm:w-64" /><Button type="submit">검색</Button></form>
        </Paper>
        {items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card component="article" key={item.slug} className="overflow-hidden">
                {item.coverUrl ? <Image src={item.coverUrl} alt="" width={800} height={600} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-background-muted"><Images aria-hidden="true" className="size-10 text-text-secondary" /></div>}
                <CardContent className="p-6!">
                  <div className="flex items-center justify-between gap-3"><Chip label={item.category} size="small" color="primary" variant="outlined" /><span className="flex items-center gap-1 text-sm text-text-secondary"><CalendarDays aria-hidden="true" className="size-4" />{item.date}</span></div>
                  <h2 className="mt-5 text-xl font-extrabold tracking-[-0.03em]">{item.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">{item.description || `사진 ${item.imageCount}장`}</p>
                  <Link href={`/news/albums/${item.slug}`} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-primary-700">앨범 보기 <ArrowRight aria-hidden="true" className="size-4" /></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <div className="rounded-2xl border border-border bg-white px-6 py-16 text-center text-text-secondary">표시할 행사앨범이 없습니다.</div>}
      </ContentShell>
    </>
  );
}

