import type { Metadata } from "next";
import { WorshipListPage } from "@/components/content/worship-list-page";

export const metadata: Metadata = { title: "수요기도회", alternates: { canonical: "/worship/wednesday" } };

export default function Page() {
  return <WorshipListPage eyebrow="WEDNESDAY WORSHIP" title="수요기도회" description="한 주의 중심에서 말씀을 듣고 함께 기도합니다." category="수요기도회" type="WEDNESDAY" />;
}
