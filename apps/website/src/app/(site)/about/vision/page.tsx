import type { Metadata } from "next";
import { ArrowUpRight, Globe2, Sparkles } from "lucide-react";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { getVisionPageContent } from "@daegwang/server/features/pages/queries";

export const metadata: Metadata = {
  title: "비전과 사명",
  description: "예배를 통해 세상이 회복됨을 믿는 독산대광교회의 목회철학입니다.",
  alternates: { canonical: "/about/vision" },
};

export const dynamic = "force-dynamic";

export default async function VisionPage() {
  const { content } = await getVisionPageContent();
  return (
    <>
      <PageHero
        eyebrow="VISION & MISSION"
        title={content.heroTitle}
        description={content.heroDescription}
      />
      <ContentShell>
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-primary-600 p-8 text-white md:p-12">
            <Sparkles aria-hidden="true" className="size-8 text-primary-100" />
            <p className="mt-12 text-sm font-bold tracking-[0.12em] text-primary-100">PASTORAL PHILOSOPHY</p>
            <h2 className="mt-3 whitespace-pre-line text-3xl font-extrabold leading-tight tracking-[-0.045em] md:text-5xl">{content.philosophy}</h2>
          </article>
          <article className="rounded-[2rem] border border-border bg-background-warm p-8 md:p-12">
            <Globe2 aria-hidden="true" className="size-8 text-primary-600" />
            <p className="mt-12 text-sm font-bold tracking-[0.12em] text-primary-700">CHURCH MOTTO</p>
            <h2 className="mt-3 whitespace-pre-line text-3xl font-extrabold leading-tight tracking-[-0.045em] md:text-5xl">{content.motto}</h2>
          </article>
        </section>
        <section className="mt-20 md:mt-28">
          <SectionTitle
            eyebrow="OUR DIRECTION"
            title={content.directionTitle}
            description={content.directionDescription}
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {content.directions.map((item, index) => (
              <div key={item} className="flex min-h-28 items-center justify-between rounded-2xl border border-border p-5">
                <div>
                  <p className="text-xs font-bold text-primary-700">0{index + 1}</p>
                  <p className="mt-2 text-lg font-extrabold">{item}</p>
                </div>
                <ArrowUpRight aria-hidden="true" className="size-5 text-primary-600" />
              </div>
            ))}
          </div>
        </section>
      </ContentShell>
    </>
  );
}
