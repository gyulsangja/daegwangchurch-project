import type { Metadata } from "next";

import { NewsListPage } from "../../../../components/content/news-list-page";
import { getEventDescription, getPublishedEvents } from "@daegwang/server/features/events/queries";

export const metadata: Metadata = {
  title: "교회 일정",
  description: "독산대광교회의 예배, 교육과 공동체 일정을 확인하세요.",
  alternates: { canonical: "/news/events" },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function EventsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const events = await getPublishedEvents(q);
  const items = events.map((event) => {
    const description = getEventDescription(event.description);
    return {
      slug: event.slug,
      title: event.title,
      date: event.startsAt.toLocaleDateString("ko-KR"),
      category: event.category,
      summary: description.replace(/\s+/g, " ").slice(0, 140) || [event.location, event.ministryName].filter(Boolean).join(" · ") || "교회 일정 안내입니다.",
    };
  });
  return <NewsListPage eyebrow="EVENTS" title="교회 일정" description="예배와 교육, 공동체의 주요 일정을 확인하세요." items={items} basePath="/news/events" query={q} />;
}

