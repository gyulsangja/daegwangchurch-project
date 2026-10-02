import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "주일 오전예배", alternates: { canonical: "/worship/sunday-morning" } };

export default function Page() {
  return <WorshipListPage eyebrow="SUNDAY WORSHIP" title="주일 오전예배" description="온 성도가 함께 드리는 주일 오전예배 전체 영상입니다." category="주일 오전예배" type="SUNDAY_MORNING" />;
}
