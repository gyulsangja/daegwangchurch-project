import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "주일 오후예배", description: "대광교회 주일 오후예배와 성경공부 영상을 날짜별로 확인하세요. 제목과 성경 본문으로 지난 말씀을 찾아보실 수 있습니다.", alternates: { canonical: "/worship/sunday-afternoon" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="SUNDAY AFTERNOON" title="주일 오후예배" description="대광교회 주일 오후예배와 성경공부 영상을 날짜별로 확인하세요. 제목과 성경 본문으로 지난 말씀을 찾아보실 수 있습니다." category="주일 오후예배" type="SUNDAY_AFTERNOON" />;
}
