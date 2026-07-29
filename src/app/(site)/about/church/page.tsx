import type { Metadata } from "next";
import { BookOpen, Church, HeartHandshake } from "lucide-react";

import { ContentShell, SectionTitle } from "@/components/site/content-shell";
import { PageHero } from "@/components/site/page-hero";
import { getChurchPageContent } from "@/features/pages/queries";

export const metadata: Metadata = {
  title: "교회소개",
  description: "1988년 독산동에서 첫 예배를 드린 독산대광교회를 소개합니다.",
  alternates: { canonical: "/about/church" },
};

const icons = [BookOpen, Church, HeartHandshake];

export const dynamic = "force-dynamic";

export default async function ChurchPage() {
  const { content } = await getChurchPageContent();
  return (
    <>
      <PageHero
        eyebrow="ABOUT DAEGWANG"
        title={content.heroTitle}
        description={content.heroDescription}
      />
      <ContentShell>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="min-h-80 rounded-[2rem] bg-primary-600 p-8 text-white md:min-h-[28rem] md:p-10">
            <p className="text-sm font-bold tracking-[0.12em] text-primary-100">{content.sinceLabel}</p>
            <p className="mt-8 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-[-0.05em] md:text-5xl">{content.motto}</p>
          </div>
          <div>
            <SectionTitle eyebrow="우리의 시작" title={content.sectionTitle} />
            <div className="mt-7 whitespace-pre-line text-lg leading-9 text-text-secondary">{content.body}</div>
          </div>
        </div>
        <section aria-labelledby="church-values" className="mt-20 md:mt-28">
          <SectionTitle eyebrow="OUR VALUES" title="대광교회가 소중히 여기는 것" />
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {content.values.map(({ title, description }, index) => {
              const Icon = icons[index] ?? BookOpen;
              return (
              <article key={title} className="rounded-2xl border border-border bg-white p-6">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold tracking-[-0.03em]">{title}</h3>
                <p className="mt-3 leading-7 text-text-secondary">{description}</p>
              </article>
              );
            })}
          </div>
        </section>
      </ContentShell>
    </>
  );
}
