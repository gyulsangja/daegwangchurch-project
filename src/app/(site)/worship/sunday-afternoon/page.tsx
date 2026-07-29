import type { Metadata } from "next";
import { WorshipListPage } from "@/components/content/worship-list-page";

export const metadata: Metadata = { title: "주일 오후예배", alternates: { canonical: "/worship/sunday-afternoon" } };

export default function Page() {
  return <WorshipListPage eyebrow="SUNDAY AFTERNOON" title="주일 오후예배" description="말씀과 찬양으로 함께하는 주일 오후예배입니다." category="주일 오후예배" type="SUNDAY_AFTERNOON" />;
}
