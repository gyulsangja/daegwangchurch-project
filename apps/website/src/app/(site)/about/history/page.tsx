import type { Metadata } from "next";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { getPublicHistoryItems } from "@daegwang/server/features/history/queries";

export const metadata: Metadata = {
  title: "교회연혁",
  description: "1988년 5월 1일 독산동에서 시작된 대광교회의 첫 예배와 연도별 주요 연혁을 소개합니다.",
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
        description="1988년 5월 1일 독산동에서 드린 첫 예배부터, 대광교회가 걸어온 시간을 연도별로 살펴보세요."
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
          </ol> : <div className="mt-9 rounded-2xl border border-border p-8 text-text-secondary">현재 공개된 추가 연혁이 없습니다. 교회의 시작은 위 안내에서 확인하실 수 있습니다.</div>}
        </section>
      </ContentShell>
    </>
  );
}
