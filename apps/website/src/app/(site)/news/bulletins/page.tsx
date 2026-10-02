import type { Metadata } from "next";

import { NewsListPage } from "../../../../components/content/news-list-page";
import { getPublishedBulletins } from "@daegwang/server/features/bulletins/queries";

export const metadata: Metadata = {
  title: "주보",
  description: "독산대광교회의 주일예배 주보를 확인하세요.",
  alternates: { canonical: "/news/bulletins" },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function BulletinsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const bulletins = await getPublishedBulletins(q);
  const items = bulletins.map((bulletin) => ({
    slug: bulletin.slug,
    title: bulletin.title,
    date: bulletin.worshipDate.toLocaleDateString("ko-KR"),
    category: "주일주보",
    summary: bulletin.summary ?? `${bulletin.worshipDate.toLocaleDateString("ko-KR")} 예배 주보입니다.`,
  }));
  return <NewsListPage eyebrow="BULLETIN" title="주보" description="매주 예배 순서와 교회 소식을 담은 주보입니다." items={items} basePath="/news/bulletins" query={q} />;
}

