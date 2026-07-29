import type { Metadata } from "next";

import { NewsListPage } from "@/components/content/news-list-page";
import { getNoticeBody, getPublishedNotices } from "@/features/notices/queries";

export const metadata: Metadata = {
  title: "공지사항",
  description: "독산대광교회의 중요한 소식과 안내를 확인하세요.",
  alternates: { canonical: "/news/notices" },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function NoticesPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const notices = await getPublishedNotices(q);
  const items = notices.map((notice) => {
    const body = getNoticeBody(notice.content);
    return {
      slug: notice.slug,
      title: notice.title,
      date: (notice.publishedAt ?? notice.createdAt).toLocaleDateString("ko-KR"),
      category: notice.category,
      summary: body.replace(/\s+/g, " ").slice(0, 140),
    };
  });

  return <NewsListPage eyebrow="NOTICE" title="공지사항" description="교회의 중요한 소식과 안내를 전합니다." items={items} basePath="/news/notices" query={q} />;
}

