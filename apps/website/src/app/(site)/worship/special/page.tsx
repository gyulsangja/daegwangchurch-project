import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "특별예배", description: "대광교회가 절기와 특별한 날에 함께 드린 예배 영상입니다. 예배 제목과 날짜를 확인하고 영상을 다시 보세요.", alternates: { canonical: "/worship/special" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="SPECIAL WORSHIP" title="특별예배" description="대광교회가 절기와 특별한 날에 함께 드린 예배 영상입니다. 예배 제목과 날짜를 확인하고 영상을 다시 보세요." category="특별예배" type="SPECIAL" />;
}
