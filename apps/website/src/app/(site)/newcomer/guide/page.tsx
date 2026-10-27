import type { Metadata } from "next";
import { ArrowRight, Church, HeartHandshake, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getSiteSettings } from '@daegwang/server/features/settings/queries';
import { getPublicSchedules } from '@daegwang/server/features/schedules/queries';

export const metadata: Metadata = {
  title: "처음 방문하는 분을 위한 새가족 안내",
  description: "서울 금천구 독산동 대광교회 첫 방문 안내입니다. 예배시간·위치·교회학교와 청년부, 새가족 등록 문의 방법을 확인하세요.",
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
    title: "새가족 교육을 알아보세요",
    description: "신앙생활의 기초를 배우는 새가족 교육과 신청 방법을 살펴보세요.",
    href: "/newcomer/education",
    icon: UsersRound,
  },
];

export default async function NewcomerGuidePage() {
  const [settings, schedules] = await Promise.all([getSiteSettings(), getPublicSchedules()]);
  const questions = [
    { question: '아이와 함께 방문하거나 청년 모임에 참여하려면 어떻게 하나요?', answer: '유초등부·중고등부·청년부의 예배와 모임을 안내하고 있습니다. 예배시간 안내에서 각 부서의 시간과 장소를 확인해 주세요. 자녀의 연령에 맞는 모임이나 첫 방문 안내가 필요하시면 교회에 문의해 주세요.', href: '/about/worship-info', label: '교회학교·청년부 시간 확인' },
    { question: '대광교회는 어디에 있나요?', answer: settings.address ? `${settings.siteName} 주소는 ${[settings.address, settings.addressDetail].filter(Boolean).join(' ')}입니다. 교통편과 지도는 오시는 길에서 확인하실 수 있습니다.` : '오시는 길에서 교회 위치와 방문 안내를 확인해 주세요.', href: '/location', label: '오시는 길' },
    { question: '예배는 언제 드리나요?', answer: schedules.length ? schedules.map(item => `${item.name}: ${item.dayLabel} ${item.timeLabel}${item.location ? ` (${item.location})` : ''}`).join('\n') : '예배안내에서 최신 예배시간을 확인해 주세요.', href: '/about/worship-info', label: '예배시간 자세히 보기' },
    { question: '설교와 주보는 회원가입 없이 볼 수 있나요?', answer: '홈페이지의 공개된 설교 영상과 주보는 회원가입 없이 보실 수 있습니다. 주일 설교는 예배 메뉴에서, 주보는 교회소식 메뉴에서 확인하세요.', href: '/news/bulletins', label: '날짜별 주보 보기' },
    { question: '처음 방문하기 전에 문의하려면 어떻게 하나요?', answer: settings.phone ? `교회 대표전화 ${settings.phone} 또는 홈페이지 문의하기를 이용해 주세요.` : '홈페이지 문의하기에서 방문과 교회 생활에 관한 질문을 남겨 주세요.', href: '/newcomer/contact', label: '문의하기' },
  ];
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
            <li key={title} className="border-t border-border py-7 pr-6">
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
        <section className="mt-12" aria-labelledby="visitor-questions">
          <h2 id="visitor-questions" className="text-2xl font-bold">처음 방문할 때 자주 묻는 질문</h2>
          <div className="mt-5 divide-y divide-border">
            {questions.map(item => <details key={item.question} className="py-4">
              <summary className="focus-ring cursor-pointer rounded py-2 text-lg font-semibold">{item.question}</summary>
              <p className="mt-3 whitespace-pre-line leading-7 text-text-secondary">{item.answer}</p>
              <Link href={item.href} className="focus-ring mt-2 inline-flex min-h-11 items-center rounded font-semibold text-primary-700">{item.label} →</Link>
            </details>)}
          </div>
        </section>
        <aside className="church-welcome mt-12 p-8 md:p-12">
          <p className="church-eyebrow">첫 방문을 함께 준비하겠습니다</p>
          <h2 className="mt-3 text-3xl leading-relaxed">궁금한 점이 있으신가요?</h2>
          <p className="mt-4 max-w-2xl">
            새가족 방문과 교회 생활에 관한 질문을 문의하기에 남길 수 있습니다. 자녀의 예배 참여나 방문 안내가 필요하시면 편하게 문의해 주세요.
          </p>
          <Button asChild className="mt-7 bg-white text-text-primary hover:bg-primary-50">
            <Link href="/newcomer/contact">문의하기</Link>
          </Button>
        </aside>
      </ContentShell>
    </>
  );
}
