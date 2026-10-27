import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "찬양", description: "대광교회 예배와 모임에서 함께 부른 찬양 영상을 모았습니다. 제목과 날짜로 찬양을 찾아보세요.", alternates: { canonical: "/worship/praise" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="PRAISE" title="찬양" description="대광교회 예배와 모임에서 함께 부른 찬양 영상을 모았습니다. 제목과 날짜로 찬양을 찾아보세요." category="찬양" type="PRAISE" />;
}
