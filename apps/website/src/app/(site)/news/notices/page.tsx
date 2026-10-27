import type { Metadata } from "next";

import { NewsListPage } from "../../../../components/content/news-list-page";
import { getNoticeBody, getPublishedNotices } from "@daegwang/server/features/notices/queries";

export const metadata: Metadata = {
  title: "공지사항",
  description: "대광교회 예배와 모임, 행사 참여에 필요한 공지사항을 확인하세요. 공지 제목을 검색하고 게시물에서 자세한 안내와 첨부자료를 볼 수 있습니다.",
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

  return <NewsListPage eyebrow="NOTICE" title="공지사항" description="예배와 모임, 교회 생활에 필요한 안내를 전합니다. 공지 제목을 누르면 본문과 첨부자료를 확인할 수 있습니다." items={items} basePath="/news/notices" query={q} />;
}

