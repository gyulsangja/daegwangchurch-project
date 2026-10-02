import type { Metadata } from "next";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { getPublicHistoryItems } from "@daegwang/server/features/history/queries";

export const metadata: Metadata = {
  title: "교회연혁",
  description: "1988년부터 이어진 독산대광교회의 발자취입니다.",
  alternates: { canonical: "/about/history" },
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const items = await getPublicHistoryItems();
  return (
    <>
      <PageHero
        eyebrow="OUR HISTORY"
        title="첫 예배에서 오늘까지"
        description="독산동에서 시작된 예배의 걸음을 기억하며 다음 세대를 향해 나아갑니다."
      />
      <ContentShell>
        <section className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr]">
          <SectionTitle eyebrow="1988" title="대광교회의 시작" />
          <div className="border-l-2 border-primary-100 pl-7 md:pl-10">
            <p className="text-2xl font-extrabold tracking-[-0.03em]">1988년 5월 1일</p>
            <p className="mt-4 text-lg leading-9 text-text-secondary">
              현재 교회 자리에 있던 신안연립에서 고 박성덕 원로목사 가정이
              첫 예배를 드리며 대광교회의 역사가 시작되었습니다.
            </p>
          </div>
        </section>
        <section className="mt-20 md:mt-28">
          <SectionTitle eyebrow="TIMELINE" title="대광교회의 발자취" />
          {items.length ? <ol className="mt-9 divide-y divide-border border-y border-border">
            {items.map((item) => {
              const date = `${item.year}년${item.month ? ` ${item.month}월` : ""}${item.day ? ` ${item.day}일` : ""}`;
              return <li key={item.id} className="grid gap-3 py-6 sm:grid-cols-[9rem_1fr]">
                <span className="font-extrabold text-primary-700">{date}</span>
                <div><h3 className="text-lg font-extrabold">{item.title}</h3>{item.content ? <p className="mt-2 whitespace-pre-line leading-7 text-text-secondary">{item.content}</p> : null}</div>
              </li>;
            })}
          </ol> : <div className="mt-9 rounded-2xl border border-border p-8 text-text-secondary">상세 연혁을 준비하고 있습니다.</div>}
        </section>
      </ContentShell>
    </>
  );
}
