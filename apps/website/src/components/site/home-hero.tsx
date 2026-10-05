import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock3 } from 'lucide-react';
import type { HomePageContent } from '@daegwang/contracts/features/pages/content';
import { Button } from '@daegwang/web-ui/components/ui/button';

type Schedule = { id: string; name: string; dayLabel: string; timeLabel: string; location: string | null };
export function HomeHero({ content, schedules }: { content: HomePageContent; schedules: Schedule[] }) {
  return <section className="home-invitation" aria-labelledby="home-title">
    <div className="container-site home-invitation-grid">
      <div className="home-invitation-copy">
        <p className="church-eyebrow flex items-center gap-3"><span className="h-px w-8 bg-primary-700" />{content.heroBadge}</p>
        <h1 id="home-title" className="mt-7 text-[clamp(2.3rem,4.1vw,4rem)] leading-[1.35] tracking-[-0.055em]">{content.heroTitleBefore}<br /><span className="text-primary-700">{content.heroTitleAccent}</span>{content.heroTitleAfter}</h1>
        <p className="mt-6 max-w-md text-base leading-8 text-text-secondary">{content.heroDescription}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"><Button asChild size="lg"><Link href="/newcomer/guide">처음 오셨나요? <ArrowRight aria-hidden="true" className="size-4" /></Link></Button><Link href="/about/church" className="church-text-link">대광교회 알아보기</Link></div>
      </div>
      <figure className="church-hero-figure home-invitation-art">
        <div className="church-hero-image relative h-full min-h-64 overflow-hidden"><Image src="/images/morning-word.jpg" alt="" fill priority sizes="(min-width: 1024px) 52vw, 100vw" className="object-cover" /></div>
        <figcaption className="home-image-caption"><span>말씀을 가까이,</span><span>서로를 따뜻이.</span></figcaption>
      </figure>
      <div className="home-service-strip" aria-labelledby="home-worship-times">
        <div><h2 id="home-worship-times" className="flex items-center gap-2 text-base font-bold"><Clock3 aria-hidden="true" className="size-4" />함께 드리는 예배</h2><Link href="/about/worship-info" className="church-text-link mt-1">예배 안내 <ArrowRight aria-hidden="true" className="size-4" /></Link></div>
        {schedules.length ? <div className="grid flex-1 gap-5 sm:grid-cols-3">{schedules.map(item => <div key={item.id}><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-text-secondary">{item.dayLabel} {item.timeLabel}</p>{item.location && <p className="text-sm text-text-secondary">{item.location}</p>}</div>)}</div> : <p className="text-sm leading-7 text-text-secondary">함께 예배드릴 여러분을 기다립니다.<br />예배 시간은 확인 후 안내하겠습니다.</p>}
        <Link href="/location" className="church-text-link shrink-0">오시는 길 <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </div>
    </div>
  </section>;
}
