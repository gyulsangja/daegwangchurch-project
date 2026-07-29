import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  MapPin,
  Play,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getPublishedWorshipContents } from "@/features/worship/queries";
import { getHomePageContent } from "@/features/pages/queries";
import { getPublicSchedules } from "@/features/schedules/queries";
import { getPublishedNotices } from "@/features/notices/queries";
import { getPublishedBulletins } from "@/features/bulletins/queries";
import { getPublishedEvents } from "@/features/events/queries";

export default async function HomePage() {
  const [sundayContents, firstHourContents, schedules, homePage, notices, bulletins, events] = await Promise.all([
    getPublishedWorshipContents("SUNDAY_MORNING", 1),
    getPublishedWorshipContents("FIRST_HOUR", 1),
    getPublicSchedules(),
    getHomePageContent(),
    getPublishedNotices("", 3),
    getPublishedBulletins("", 1),
    getPublishedEvents("", 1),
  ]);
  const latestSunday = sundayContents[0];
  const latestFirstHour = firstHourContents[0];
  const content = homePage.content;
  const worshipTimes = schedules.slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden bg-background-warm">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[34%] bg-primary-50 lg:block" />
        <div aria-hidden="true" className="absolute right-[8%] top-24 size-44 rounded-full border-[28px] border-primary-100/80 lg:block" />
        <div className="container-site relative grid min-h-[38rem] items-center gap-12 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-bold text-primary-700">
              <Sparkles aria-hidden="true" className="size-4" />
              {content.heroBadge}
            </p>
            <h1 className="text-balance text-[clamp(2.75rem,7vw,5.7rem)] font-extrabold leading-[1.03] tracking-[-0.065em] text-text-primary">
              {content.heroTitleBefore}
              <br />
              <span className="text-primary-600">{content.heroTitleAccent}</span>
              <br />
              {content.heroTitleAfter}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-text-secondary md:text-xl">
              {content.heroDescription}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/about/worship-info">
                  예배 안내 <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/newcomer/guide">처음 오셨나요?</Link>
              </Button>
            </div>
          </div>
          <aside className="relative rounded-[2rem] border border-border bg-white p-6 shadow-[0_24px_70px_rgba(38,35,33,0.08)] md:p-8">
            <p className="text-sm font-bold tracking-[0.08em] text-primary-700">WORSHIP WITH US</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">이번 주 예배 안내</h2>
            <div className="mt-6 divide-y divide-border">
              {worshipTimes.map((schedule, index) => {
                const Icon = index === 0 ? Clock3 : CalendarDays;
                return <div key={schedule.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">{schedule.name}</p>
                    <p className="text-sm text-text-secondary">{schedule.dayLabel} {schedule.timeLabel}{schedule.location ? ` · ${schedule.location}` : ""}</p>
                  </div>
                </div>;
              })}
            </div>
            {worshipTimes.length === 0 ? <p className="mt-6 rounded-xl bg-background-muted px-4 py-3 text-sm text-text-secondary">예배시간을 준비하고 있습니다.</p> : null}
          </aside>
        </div>
      </section>

      {content.showWorship ? <section aria-labelledby="latest-worship" className="py-20 md:py-28">
        <div className="container-site">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-primary-700">LATEST WORSHIP</p>
              <h2 id="latest-worship" className="mt-2 text-3xl font-extrabold tracking-[-0.045em] md:text-5xl">
                {content.worshipTitle}
              </h2>
            </div>
            <Link href="/worship/sunday-morning" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-primary-700">
              지난 예배 보기 <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="overflow-hidden rounded-[1.75rem] bg-text-primary text-white">
              <Link href={latestSunday ? `/worship/videos/${latestSunday.slug}` : "/worship/sunday-morning"} className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#34302d]">
                {latestSunday?.thumbnailUrl ? <Image src={latestSunday.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover opacity-75" /> : null}
                <span className="relative z-10 flex size-16 items-center justify-center rounded-full bg-primary-600 shadow-lg">
                  <Play aria-hidden="true" className="ml-1 size-7 fill-white" />
                </span>
              </Link>
              <div className="p-6 md:p-8">
                <p className="text-sm font-bold text-primary-100">최신 주일 오전예배</p>
                <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em]">{latestSunday?.title ?? "예배 영상이 곧 연결됩니다"}</h3>
                <p className="mt-3 text-sm text-white/70">{latestSunday ? latestSunday.contentDate.toISOString().slice(0, 10) : "공개된 예배 영상이 아직 없습니다."}</p>
              </div>
            </article>
            <article className="flex flex-col rounded-[1.75rem] border border-border bg-primary-50 p-7 md:p-8">
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-primary-700">
                <BookOpenText aria-hidden="true" className="size-6" />
              </span>
              <p className="mt-8 text-sm font-bold text-primary-700">매일의 묵상</p>
              <h3 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{latestFirstHour?.title ?? "첫 시간 주님께"}</h3>
              <p className="mt-4 leading-7 text-text-secondary">
                {latestFirstHour?.summary ?? latestFirstHour?.description ?? "하루의 첫 시간을 말씀과 기도로 열어가는 독산대광교회의 묵상 영상입니다."}
              </p>
              <Link href={latestFirstHour ? `/worship/videos/${latestFirstHour.slug}` : "/worship/first-hour"} className="focus-ring mt-auto inline-flex min-h-11 items-center gap-2 rounded-full pt-8 font-bold text-primary-700">
                오늘의 묵상 보기 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
          </div>
        </div>
      </section> : null}

      {content.showNews ? <section className="border-y border-border bg-white py-20 md:py-24"><div className="container-site"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-bold tracking-[0.12em] text-primary-700">CHURCH NEWS</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] md:text-5xl">{content.newsTitle}</h2></div><Link href="/news/notices" className="font-bold text-primary-700">모든 소식 보기 <ArrowRight className="ml-1 inline size-4" /></Link></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{notices.map((notice) => <Link key={notice.id} href={`/news/notices/${notice.slug}`} className="rounded-2xl border border-border p-6 transition hover:border-primary-400"><p className="text-sm font-bold text-primary-700">{notice.category}</p><h3 className="mt-3 line-clamp-2 text-xl font-extrabold">{notice.title}</h3><p className="mt-5 text-sm text-text-secondary">{notice.publishedAt?.toLocaleDateString("ko-KR") ?? notice.createdAt.toLocaleDateString("ko-KR")}</p></Link>)}{notices.length === 0 ? <div className="rounded-2xl border border-border p-6 text-text-secondary">등록된 공지사항이 없습니다.</div> : null}</div><div className="mt-5 grid gap-5 md:grid-cols-2"><Link href={bulletins[0] ? `/news/bulletins/${bulletins[0].slug}` : "/news/bulletins"} className="rounded-2xl bg-primary-50 p-6"><p className="text-sm font-bold text-primary-700">LATEST BULLETIN</p><h3 className="mt-2 text-xl font-extrabold">{bulletins[0]?.title ?? "최근 주보 보기"}</h3></Link><Link href={events[0] ? `/news/events/${events[0].slug}` : "/news/events"} className="rounded-2xl bg-background-warm p-6"><p className="text-sm font-bold text-primary-700">UPCOMING EVENT</p><h3 className="mt-2 text-xl font-extrabold">{events[0]?.title ?? "교회 일정 보기"}</h3></Link></div></div></section> : null}

      {content.showChurch ? <section className="bg-background-warm py-20 md:py-28">
        <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div className="relative min-h-80 overflow-hidden rounded-[2rem] bg-primary-600 p-8 text-white md:min-h-[28rem]">
            <span aria-hidden="true" className="absolute -bottom-20 -right-16 size-72 rounded-full border-[48px] border-white/15" />
            <p className="relative text-sm font-bold tracking-[0.12em] text-primary-100">{content.sinceLabel}</p>
            <p className="relative mt-6 max-w-sm whitespace-pre-line text-4xl font-extrabold leading-tight tracking-[-0.05em] md:text-5xl">{content.motto}</p>
          </div>
          <div>
            <p className="text-sm font-bold tracking-[0.12em] text-primary-700">OUR CHURCH</p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-[-0.045em] md:text-5xl">
              {content.churchTitle}
            </h2>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              {content.churchDescription}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link href="/about/church" className="focus-ring flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-white p-5 font-bold hover:border-primary-500">
                <UsersRound aria-hidden="true" className="size-6 text-primary-600" />
                교회 소개
              </Link>
              <Link href="/location" className="focus-ring flex min-h-28 items-center gap-4 rounded-2xl border border-border bg-white p-5 font-bold hover:border-primary-500">
                <MapPin aria-hidden="true" className="size-6 text-primary-600" />
                다시 오실 길
              </Link>
            </div>
          </div>
        </div>
      </section> : null}

      {content.showWelcome ? <section className="py-20 md:py-28">
        <div className="container-site rounded-[2rem] bg-text-primary px-6 py-14 text-center text-white md:px-12 md:py-20">
          <p className="text-sm font-bold tracking-[0.12em] text-primary-100">WELCOME HOME</p>
          <h2 className="text-balance mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.045em] md:text-5xl">
            {content.welcomeTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/70">
            {content.welcomeDescription}
          </p>
          <Button asChild size="lg" className="mt-8 bg-white text-text-primary hover:bg-primary-50">
            <Link href="/newcomer/guide">새가족 안내 보기</Link>
          </Button>
        </div>
      </section> : null}
    </>
  );
}
export const dynamic = "force-dynamic";
