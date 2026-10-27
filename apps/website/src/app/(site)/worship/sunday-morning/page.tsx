import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "주일 오전예배", description: "대광교회 주일 오전예배와 설교 영상을 날짜별로 모았습니다. 제목·성경 본문·설교자로 말씀을 찾아 다시 들으실 수 있습니다.", alternates: { canonical: "/worship/sunday-morning" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="SUNDAY WORSHIP" title="주일 오전예배" description="대광교회 주일 오전예배와 설교 영상을 날짜별로 모았습니다. 제목·성경 본문·설교자로 말씀을 찾아 다시 들으실 수 있습니다." category="주일 오전예배" type="SUNDAY_MORNING" />;
}
