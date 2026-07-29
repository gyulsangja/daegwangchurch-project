import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { YouTubeEmbed } from "@/components/content/youtube-embed";
import { ContentShell } from "@/components/site/content-shell";
import { Button } from "@/components/ui/button";
import { getPublishedWorshipContentBySlug } from "@/features/worship/queries";
import { worshipTypeLabels } from "@/features/worship/schema";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const databaseItem = await getPublishedWorshipContentBySlug(slug);
  if (!databaseItem) return { title: "예배 영상", robots: { index: false } };
  return { title: databaseItem.title, description: databaseItem.summary || databaseItem.description || undefined, alternates: { canonical: `/worship/videos/${databaseItem.slug}` } };
}

export default async function WorshipDetailPage({ params }: Props) {
  const { slug } = await params;
  const databaseItem = await getPublishedWorshipContentBySlug(slug);
  if (!databaseItem) notFound();
  const item = {
        category: worshipTypeLabels[databaseItem.type],
        date: databaseItem.contentDate.toISOString().slice(0, 10).replaceAll("-", "."),
        title: databaseItem.title,
        preacher: databaseItem.preacher,
        scripture: databaseItem.scripture,
        summary: databaseItem.summary || databaseItem.description || "등록된 예배 콘텐츠입니다.",
        videoId: databaseItem.youtubeVideoId,
        youtubeUrl: databaseItem.youtubeUrl,
      };

  return (
    <ContentShell narrow>
      <Link href="/worship/sunday-morning" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-text-secondary hover:text-primary-700">
        <ArrowLeft aria-hidden="true" className="size-4" /> 예배 목록
      </Link>
      <p className="mt-8 text-sm font-bold text-primary-700">{item.category} · {item.date}</p>
      <h1 className="text-balance mt-3 text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">{item.title}</h1>
      <div className="mt-8"><YouTubeEmbed videoId={item.videoId} title={item.title} /></div>
      <dl className="mt-8 grid grid-cols-[7rem_1fr] gap-y-3 border-y border-border py-6 text-sm">
        <dt className="font-bold text-text-secondary">예배 유형</dt><dd>{item.category}</dd>
        <dt className="font-bold text-text-secondary">날짜</dt><dd>{item.date}</dd>
        {item.preacher ? <><dt className="font-bold text-text-secondary">설교자</dt><dd>{item.preacher}</dd></> : null}
        {item.scripture ? <><dt className="font-bold text-text-secondary">성경 본문</dt><dd>{item.scripture}</dd></> : null}
      </dl>
      <section className="py-9">
        <h2 className="text-2xl font-extrabold">내용 요약</h2>
        <p className="mt-4 leading-8 text-text-secondary">{item.summary}</p>
      </section>
      <div className="flex flex-wrap gap-3 border-t border-border pt-7">
        <Button asChild><a href={item.youtubeUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" className="size-4" /> YouTube에서 보기</a></Button>
      </div>
    </ContentShell>
  );
}
