import type { Metadata } from "next";
import { BookOpenText, HeartHandshake, Sprout } from "lucide-react";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { getVisionPageContent } from "@daegwang/server/features/pages/queries";

export const metadata: Metadata = {
  title: "비전과 사명",
  description: "예배를 통해 세상이 회복됨을 믿는 대광교회의 목회철학입니다.",
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
          <article className="rounded-xl border border-border bg-primary-50 p-8 md:p-12">
            <BookOpenText aria-hidden="true" className="size-9 text-primary-700" strokeWidth={1.3} />
            <p className="church-eyebrow mt-10">말씀 위에 세워가는 교회</p>
            <h2 className="church-display mt-4 whitespace-pre-line text-3xl leading-relaxed md:text-4xl">{content.philosophy}</h2>
          </article>
          <article className="rounded-xl border border-border bg-background-warm p-8 md:p-12">
            <Sprout aria-hidden="true" className="size-9 text-primary-700" strokeWidth={1.3} />
            <p className="church-eyebrow mt-10">우리 공동체의 고백</p>
            <h2 className="church-display mt-4 whitespace-pre-line text-3xl leading-relaxed md:text-4xl">{content.motto}</h2>
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
                <HeartHandshake aria-hidden="true" className="ml-4 size-6 shrink-0 text-primary-600" strokeWidth={1.3} />
              </div>
            ))}
          </div>
        </section>
      </ContentShell>
    </>
  );
}
