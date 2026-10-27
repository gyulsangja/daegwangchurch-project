import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "첫시간 주님께", description: "하루를 말씀과 기도로 여는 대광교회 묵상 영상입니다. 날짜와 제목, 성경 본문으로 지난 묵상을 찾아보세요.", alternates: { canonical: "/worship/first-hour" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="FIRST HOUR" title="첫시간 주님께" description="하루를 말씀과 기도로 여는 대광교회 묵상 영상입니다. 날짜와 제목, 성경 본문으로 지난 묵상을 찾아보세요." category="첫시간 주님께" type="FIRST_HOUR" />;
}
