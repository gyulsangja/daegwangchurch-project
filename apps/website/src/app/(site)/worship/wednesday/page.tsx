import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "수요기도회", description: "말씀을 듣고 함께 기도하는 대광교회 수요기도회 영상입니다. 날짜와 제목으로 지난 기도회 말씀을 찾아보세요.", alternates: { canonical: "/worship/wednesday" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="WEDNESDAY WORSHIP" title="수요기도회" description="말씀을 듣고 함께 기도하는 대광교회 수요기도회 영상입니다. 날짜와 제목으로 지난 기도회 말씀을 찾아보세요." category="수요기도회" type="WEDNESDAY" />;
}
