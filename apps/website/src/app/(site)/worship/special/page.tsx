import type { Metadata } from "next";
import { WorshipListPage } from "../../../../components/content/worship-list-page";

export const metadata: Metadata = { title: "특별예배", alternates: { canonical: "/worship/special" } };

export default function Page() {
  return <WorshipListPage eyebrow="SPECIAL WORSHIP" title="특별예배" description="절기와 특별한 날에 함께 드린 예배를 모았습니다." category="특별예배" type="SPECIAL" />;
}
