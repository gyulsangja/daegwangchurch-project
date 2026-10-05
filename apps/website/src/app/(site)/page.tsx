import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpenText, CalendarDays, MapPin, Play, HeartHandshake } from 'lucide-react';
import { HomeHero } from '../../components/site/home-hero';
import { getPublishedWorshipContents } from '@daegwang/server/features/worship/queries';
import { getHomePageContent } from '@daegwang/server/features/pages/queries';
import { getPublicSchedules } from '@daegwang/server/features/schedules/queries';
import { getPublishedNotices } from '@daegwang/server/features/notices/queries';
import { getPublishedBulletins } from '@daegwang/server/features/bulletins/queries';
import { getPublishedEvents } from '@daegwang/server/features/events/queries';
import { worshipTypeLabels } from '@daegwang/contracts/features/worship/schema';

function More({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="home-more">{children}<ArrowRight aria-hidden="true" className="size-4" /></Link>;
}
export default async function HomePage() {
  const [sunday, firstHour, schedules, homePage, notices, bulletins, events] = await Promise.all([
    getPublishedWorshipContents('SUNDAY_MORNING', 1), getPublishedWorshipContents('FIRST_HOUR', 1), getPublicSchedules(), getHomePageContent(),
    getPublishedNotices('', 3), getPublishedBulletins('', 1), getPublishedEvents('', 2),
  ]);
  const content = homePage.content;
  const sermon = sunday[0]; const devotional = firstHour[0]; const bulletin = bulletins[0];
  return <>
    <HomeHero content={content} schedules={schedules.slice(0, 3)} />
    {content.showWorship && <section aria-labelledby="home-word" className="home-word-section">
      <div className="container-site">
        <div className="home-section-heading"><div><p className="church-eyebrow">예배에서 일상으로</p><h2 id="home-word" className="home-section-title">말씀이 머무는 시간</h2></div><p className="max-w-sm text-sm leading-7 text-text-secondary">주일에 들은 말씀을 되새기고,<br className="hidden md:block" /> 매일의 첫시간을 하나님과 함께 엽니다.</p></div>
        <div className="home-word-grid">
          <article aria-labelledby="home-sunday" className="home-sermon">
            <div className="flex items-center justify-between gap-4"><h3 id="home-sunday" className="text-sm font-semibold">{worshipTypeLabels.SUNDAY_MORNING}</h3><span className="text-xs text-white/70">{sermon?.contentDate.toISOString().slice(0, 10) ?? '함께 듣는 말씀'}</span></div>
            {sermon?.thumbnailUrl && <Link href={`/worship/videos/${sermon.slug}`} aria-label={`${sermon.title} 영상 보기`} className="home-sermon-image"><Image src={sermon.thumbnailUrl} alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" /><span className="home-play"><Play aria-hidden="true" className="size-5 fill-current" /></span></Link>}
            <div className={sermon?.thumbnailUrl ? 'mt-6' : 'py-10 md:py-14'}>{!sermon && <BookOpenText aria-hidden="true" className="mb-8 size-10 stroke-1 text-[#c4d4bb]" />}<h4 className="max-w-xl text-2xl font-semibold leading-relaxed md:text-3xl">{sermon?.title ?? <>한 주의 중심에,<br />하나님의 말씀을.</>}</h4><p className="mt-4 max-w-lg text-sm leading-7 text-white/75">{sermon ? [sermon.scripture, sermon.preacher].filter(Boolean).join(' · ') : '공개된 예배 영상이 등록되면 이곳에서 함께 들으실 수 있습니다.'}</p></div>
            <More href={sermon ? `/worship/videos/${sermon.slug}` : '/worship/sunday-morning'}>{sermon ? '이번 주 말씀 듣기' : '예배 영상 모아보기'}</More>
          </article>
          <article aria-labelledby="home-first-hour" className="home-devotional">
            <BookOpenText aria-hidden="true" className="size-7 stroke-[1.3] text-primary-700" /><p className="mt-6 text-xs font-semibold tracking-wider text-primary-700">하루를 여는 묵상</p><h3 id="home-first-hour" className="mt-3 text-2xl font-bold">{worshipTypeLabels.FIRST_HOUR}</h3><div className="my-7 h-px w-10 bg-[#b6bba5]" />
            {devotional ? <><p className="text-xs text-text-secondary">{devotional.contentDate.toISOString().slice(0, 10)}</p><h4 className="mt-3 text-xl font-semibold leading-relaxed">{devotional.title}</h4><p className="mt-3 line-clamp-4 text-sm leading-7 text-text-secondary">{devotional.summary || devotional.description || devotional.scripture}</p></> : <p className="max-w-xs leading-8 text-text-secondary">분주한 하루에 앞서<br />말씀을 읽고 마음을 모으는<br />작은 시간을 가져보세요.</p>}
            <div className="mt-auto pt-8"><More href={devotional ? `/worship/videos/${devotional.slug}` : '/worship/first-hour'}>{devotional ? '최근 묵상 열기' : '첫시간 만나보기'}</More></div>
          </article>
        </div>
      </div>
    </section>}
    {content.showNews && <section aria-labelledby="home-community" className="home-community-section"><div className="container-site">
      <div className="home-section-heading"><div><p className="church-eyebrow">함께 살아가는 교회</p><h2 id="home-community" className="home-section-title">우리 공동체의 소식</h2></div><More href="/news/notices">소식 더보기</More></div>
      <div className="home-community-grid">
        <article aria-labelledby="home-bulletin" className="home-bulletin"><div className="home-bulletin-paper" aria-hidden="true"><BookOpenText className="size-6 stroke-1" /><span className="mt-7 text-xs tracking-[.25em]">대광교회</span><span className="mt-2 text-3xl font-semibold">주보</span><span className="mt-8 h-px w-12 bg-current opacity-30" /><span className="mt-3 text-xs">예배와 공동체의 이야기</span></div><div><h3 id="home-bulletin" className="text-sm font-semibold text-primary-700">한눈에 보는 교회생활</h3><h4 className="mt-3 text-xl font-bold leading-relaxed">{bulletin?.title ?? '주보로 만나는 대광교회'}</h4><p className="mt-2 text-sm leading-7 text-text-secondary">{bulletin ? bulletin.worshipDate.toISOString().slice(0, 10) : '예배 순서와 한 주의 소식을 담습니다.'}</p><More href={bulletin ? `/news/bulletins/${bulletin.slug}` : '/news/bulletins'}>{bulletin ? '주보 열기' : '주보 모아보기'}</More></div></article>
        <div className="min-w-0">
          <article aria-labelledby="home-notices"><div className="flex items-center justify-between border-b border-text-primary pb-4"><h3 id="home-notices" className="text-lg font-bold">교회에서 전하는 소식</h3><Link href="/news/notices" aria-label="공지사항 전체 보기" className="inline-flex size-11 items-center justify-center"><ArrowRight aria-hidden="true" className="size-5" /></Link></div>{notices.length ? <ul className="divide-y divide-border">{notices.map(item => <li key={item.id}><Link href={`/news/notices/${item.slug}`} className="block py-5"><span className="text-xs text-primary-700">{item.category}</span><h4 className="mt-2 text-lg font-semibold leading-relaxed">{item.title}</h4><p className="mt-2 text-xs text-text-secondary">{(item.publishedAt ?? item.createdAt).toISOString().slice(0, 10)}</p></Link></li>)}</ul> : <p className="py-8 text-sm leading-7 text-text-secondary">교회의 새로운 소식이 준비되면<br />이곳에서 전해드리겠습니다.</p>}</article>
          <article aria-labelledby="home-events" className="home-events"><CalendarDays aria-hidden="true" className="mt-1 size-6 shrink-0 stroke-[1.3] text-primary-700" /><div className="min-w-0 flex-1"><h3 id="home-events" className="font-bold">함께할 다음 만남</h3>{events.length ? events.map(item => <Link key={item.id} href={`/news/events/${item.slug}`} className="mt-3 block text-sm leading-7 underline decoration-border underline-offset-4">{item.title}</Link>) : <p className="mt-2 text-sm leading-7 text-text-secondary">예배와 모임, 교회 일정을 확인하세요.</p>}<More href="/news/events">일정 살펴보기</More></div></article>
        </div>
      </div>
    </div></section>}
    {(content.showChurch || content.showWelcome) && <section aria-labelledby="home-belong" className="home-belong-section"><div className="container-site home-belong-grid">
      <div>{content.showChurch ? <><p className="church-eyebrow">대광교회라는 공동체</p><h2 id="home-belong" className="home-section-title max-w-lg">{content.churchTitle}</h2><p className="mt-6 max-w-lg leading-8 text-text-secondary">{content.churchDescription}</p><More href="/about/church">우리 교회 이야기</More></> : <><p className="church-eyebrow">당신의 첫 방문을 기다립니다</p><h2 id="home-belong" className="home-section-title">대광교회에 오신 것을 환영합니다</h2></>}</div>
      {content.showWelcome ? <div className="home-welcome-note"><HeartHandshake aria-hidden="true" className="size-8 stroke-[1.3] text-primary-700" /><h3 className="mt-5 text-2xl font-semibold leading-relaxed">{content.welcomeTitle}</h3><p className="mt-4 text-sm leading-7 text-text-secondary">{content.welcomeDescription}</p><More href="/newcomer/guide">처음 오신 분을 위한 안내</More><Link href="/location" className="mt-5 flex min-h-11 items-center gap-2 border-t border-border pt-5 text-sm font-semibold text-primary-700"><MapPin aria-hidden="true" className="size-4" />교회로 오시는 길<ArrowRight aria-hidden="true" className="ml-auto size-4" /></Link></div> : <div className="home-church-values"><BookOpenText aria-hidden="true" className="size-8 stroke-1" /><p className="mt-5 text-2xl font-semibold leading-relaxed">말씀으로 만나고,<br />삶으로 함께합니다.</p><More href="/about/vision">비전과 사명</More></div>}
    </div></section>}
  </>;
}
export const dynamic = 'force-dynamic';
