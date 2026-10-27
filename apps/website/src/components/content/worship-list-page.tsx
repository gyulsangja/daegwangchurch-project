import Paper from "@mui/material/Paper";
import { CalendarDays, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ContentShell } from "../site/content-shell";
import { PageHero } from "../site/page-hero";
import { MediaPlaceholder } from "./media-placeholder";
import type { WorshipContentType } from "@daegwang/database/generated/client";
import { getWorshipArchive, type WorshipArchiveSearch } from "@daegwang/server/features/worship/queries";
import { ArchivePagination } from '@daegwang/web-ui/components/ui/archive-pagination';

type WorshipListPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  category: string;
  type: WorshipContentType;
  query?: WorshipArchiveSearch;
};

export async function WorshipListPage({ eyebrow, title, description, category, type, query = {} }: WorshipListPageProps) {
  const archive = await getWorshipArchive(query, type);
  const databaseItems = archive.items;
  const items = databaseItems.map((item) => ({
        slug: item.slug,
        category,
        title: item.title,
        date: item.contentDate.toISOString().slice(0, 10).replaceAll("-", "."),
        summary: item.summary || item.description || [item.scripture, item.preacher].filter(Boolean).join(' · ') || `${category} 영상입니다. 제목을 눌러 영상을 보실 수 있습니다.`,
        thumbnailUrl: item.thumbnailUrl,
      }));
  const primary = items[0];
  const featured = archive.page === 1 && !archive.q && !archive.month;

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <ContentShell>
        <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border p-4"><label className="min-w-0 flex-1 text-sm font-semibold">제목·본문·설교자 검색<input name="q" defaultValue={archive.q} className="mt-2 block min-h-11 w-full rounded-lg border border-border bg-white px-3" /></label><label className="text-sm font-semibold">조회 월<input type="month" name="month" defaultValue={archive.month} className="mt-2 block min-h-11 max-w-full rounded-lg border border-border bg-white px-3" /></label><button className="min-h-11 rounded-lg bg-primary-700 px-5 font-semibold text-white">조회</button><Link href="?" className="inline-flex min-h-11 items-center px-2 text-sm underline">전체 보기</Link></form>
        {primary ? <>{featured && <article className="grid overflow-hidden rounded-[2rem] border border-border lg:grid-cols-[1.2fr_0.8fr]">
          {primary.thumbnailUrl ? <div className="relative aspect-video w-full self-center overflow-hidden bg-black"><Image src={primary.thumbnailUrl} alt="" fill sizes="(min-width: 1280px) 720px, (min-width: 1024px) 60vw, 100vw" className="object-contain" /></div> : <MediaPlaceholder type="video" label="YouTube 영상" className="w-full self-center" />}
          <div className="flex flex-col justify-center p-7 md:p-10">
            <p className="text-sm font-bold text-primary-700">최신 {category}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">{primary.title}</h2>
            <p className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
              <CalendarDays aria-hidden="true" className="size-4" /> {primary.date}
            </p>
            <p className="mt-5 leading-7 text-text-secondary">{primary.summary}</p>
            <Link href={`/worship/videos/${primary.slug}`} className="focus-ring mt-7 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-primary-600 px-5 font-bold text-white hover:bg-primary-700">
              <Play aria-hidden="true" className="size-4 fill-white" /> 예배 영상 보기
            </Link>
          </div>
        </article>}
        <section aria-labelledby="past-worship" className="mt-8">
          <h2 id="past-worship" className="text-2xl font-extrabold tracking-[-0.035em]">{archive.q || archive.month ? '조회 결과' : '지난 콘텐츠'}</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(featured ? items.slice(1) : items).map((item) => (
              <article key={item.slug} className="overflow-hidden rounded-2xl border border-border">
                {item.thumbnailUrl ? <div className="relative aspect-video w-full overflow-hidden bg-black"><Image src={item.thumbnailUrl} alt="" fill sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain" /></div> : <MediaPlaceholder type="video" label={item.category} />}
                <div className="p-5">
                  <p className="text-xs font-bold text-primary-700">{item.category} · {item.date}</p>
                  <h3 className="mt-2 text-lg font-extrabold">{item.title}</h3>
                  <Link href={`/worship/videos/${item.slug}`} aria-label={`${item.title} 영상 보기`} className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full font-bold text-primary-700">영상 보기</Link>
                </div>
              </article>
            ))}
          </div>
        </section></> : <Paper variant="outlined" className="p-12 text-center"><h2 className="text-2xl font-extrabold">{archive.q || archive.month ? '검색 조건에 맞는 영상이 없습니다' : `현재 공개된 ${category} 영상이 없습니다`}</h2><p className="mt-3 text-text-secondary">{archive.q || archive.month ? '검색어나 조회 월을 바꾸거나, 전체 보기를 눌러 다른 영상을 확인해 주세요.' : '다른 예배 영상은 예배와 말씀 메뉴에서 확인하실 수 있습니다.'}</p></Paper>}
        <ArchivePagination page={archive.page} pageCount={archive.pageCount} total={archive.total} filters={{ q: archive.q, month: archive.month }} />
      </ContentShell>
    </>
  );
}
