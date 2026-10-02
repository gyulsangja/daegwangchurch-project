import type { Metadata } from "next";
import { ArrowRight, Church, HeartHandshake, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { Button } from "@daegwang/web-ui/components/ui/button";

export const metadata: Metadata = {
  title: "처음 오셨나요?",
  description: "독산대광교회를 처음 방문하는 분을 위한 안내입니다.",
  alternates: { canonical: "/newcomer/guide" },
};

const guideSteps = [
  {
    title: "예배 시간을 확인하세요",
    description: "방문 전 예배 시간과 장소를 확인해 주세요.",
    href: "/about/worship-info",
    icon: Church,
  },
  {
    title: "교회로 오세요",
    description: "대중교통과 주차 안내는 오시는 길에서 확인할 수 있습니다.",
    href: "/location",
    icon: MapPin,
  },
  {
    title: "새가족 안내를 받으세요",
    description: "예배 후 새가족부가 등록과 교회 생활을 안내합니다.",
    href: "/newcomer/register",
    icon: HeartHandshake,
  },
  {
    title: "공동체와 함께하세요",
    description: "연령별 공동체에서 믿음의 동역자를 만나세요.",
    href: "/newcomer/education",
    icon: UsersRound,
  },
];

export default function NewcomerGuidePage() {
  return (
    <>
      <PageHero
        eyebrow="WELCOME"
        title="처음 오신 여러분을 환영합니다"
        description="교회가 처음이어도 괜찮습니다. 편안한 마음으로 예배의 자리에 함께해 주세요."
      />
      <ContentShell>
        <SectionTitle
          eyebrow="FIRST VISIT"
          title="처음 방문하는 순서"
          description="방문 전부터 예배 후 안내까지 필요한 정보를 차례로 확인해 보세요."
        />
        <ol className="mt-10 grid gap-5 md:grid-cols-2">
          {guideSteps.map(({ title, description, href, icon: Icon }, index) => (
            <li key={title} className="rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <span className="text-sm font-extrabold text-primary-600">0{index + 1}</span>
              </div>
              <h2 className="mt-6 text-xl font-extrabold">{title}</h2>
              <p className="mt-3 leading-7 text-text-secondary">{description}</p>
              <Link href={href} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-primary-700">
                자세히 보기 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </li>
          ))}
        </ol>
        <aside className="mt-12 rounded-[2rem] bg-text-primary p-8 text-white md:p-12">
          <p className="text-sm font-bold tracking-[0.12em] text-primary-100">YOU ARE WELCOME</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">궁금한 점이 있으신가요?</h2>
          <p className="mt-4 max-w-2xl text-white/70">
            새가족 방문과 교회 생활에 관한 질문을 온라인으로 안전하게 남길 수 있습니다.
          </p>
          <Button asChild className="mt-7 bg-white text-text-primary hover:bg-primary-50">
            <Link href="/newcomer/contact">문의하기</Link>
          </Button>
        </aside>
      </ContentShell>
    </>
  );
}
