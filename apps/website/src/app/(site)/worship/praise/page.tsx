import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "찬양", alternates: { canonical: "/worship/praise" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; month?: string; page?: string }> }) {
  const query = await searchParams;
  return <WorshipListPage query={query} eyebrow="PRAISE" title="찬양" description="대광교회 공동체가 함께 부른 찬양입니다." category="찬양" type="PRAISE" />;
}
