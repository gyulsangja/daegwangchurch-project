import type { Metadata } from "next";

import { NewsListPage } from "../../../../components/content/news-list-page";
import { getPublishedBulletins } from "@daegwang/server/features/bulletins/queries";

export const metadata: Metadata = {
  title: "주보",
  description: "대광교회 주보를 예배 날짜별로 확인하세요. 예배 순서와 교회 소식을 읽고 등록된 주보 이미지·파일을 크게 볼 수 있습니다.",
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
  return <NewsListPage eyebrow="BULLETIN" title="주보" description="예배 날짜별 주보에서 예배 순서와 교회 소식을 확인하세요. 주보를 열면 등록된 이미지와 파일을 크게 볼 수 있습니다." items={items} basePath="/news/bulletins" query={q} />;
}

