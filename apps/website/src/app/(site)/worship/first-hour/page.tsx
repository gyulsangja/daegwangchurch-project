import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "첫 시간 주님께", alternates: { canonical: "/worship/first-hour" } };

export default function Page() {
  return <WorshipListPage eyebrow="FIRST HOUR" title="첫 시간 주님께" description="하루의 첫 시간을 말씀과 기도로 시작하는 매일 묵상입니다." category="첫 시간 주님께" type="FIRST_HOUR" />;
}
