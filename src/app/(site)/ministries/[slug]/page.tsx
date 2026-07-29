import type { Metadata } from "next";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { MediaPlaceholder } from "@/components/content/media-placeholder";
import { ContentShell, SectionTitle } from "@/components/site/content-shell";
import { PageHero } from "@/components/site/page-hero";
import { ministryData } from "@/content/ministry-defaults";
import { getMinistryPrograms, getPublishedMinistry } from "@/features/ministries/queries";
import { getPublicStorageUrl } from "@/lib/storage/public-url";

type MinistrySlug = keyof typeof ministryData;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(ministryData).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ministry = await getPublishedMinistry(slug);
  const fallback = ministryData[slug as MinistrySlug];
  const name = ministry?.name ?? fallback?.name;
  const description = ministry?.introduction ?? fallback?.description;
  return name ? { title: name, description, alternates: { canonical: `/ministries/${slug}` } } : { title: "교회학교와 사역" };
}

export const dynamic = "force-dynamic";

export default async function MinistryPage({ params }: Props) {
  const { slug } = await params;
  const record = await getPublishedMinistry(slug);
  const fallback = ministryData[slug as MinistrySlug];
  if (!record && !fallback) notFound();
  const name = record?.name ?? fallback.name;
  const introduction = record?.introduction ?? fallback.description;
  const audience = record?.audience ?? fallback.audience;
  const programs = record ? getMinistryPrograms(record.sections) : slug === "blessing-football" ? ["전문 코치의 체계적인 훈련", "즐겁게 참여하는 팀 게임", "유초등부부터 청년부까지 참여", "모든 순서 후 복음 나눔"] : [];
  const heroDescription = record ? `${name} 공동체를 소개합니다.` : fallback.slogan;

  return (
    <>
      <PageHero eyebrow="NEXT GENERATION & MINISTRY" title={name} description={heroDescription} />
      <ContentShell>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="overflow-hidden rounded-[2rem]">{record?.coverImage ? <Image src={getPublicStorageUrl(record.coverImage.bucket, record.coverImage.objectPath)} alt={record.coverImage.altText ?? `${name} 대표 사진`} width={1200} height={900} className="aspect-[4/3] w-full object-cover" priority /> : <MediaPlaceholder label={`${name} 대표 사진`} className="lg:aspect-[4/3]" />}</div>
          <div>
            <p className="text-sm font-bold tracking-[0.12em] text-primary-700">ABOUT US</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">함께 예배하고 성장합니다</h2>
            <p className="mt-6 whitespace-pre-line text-lg leading-9 text-text-secondary">{introduction}</p>
          </div>
        </div>
        <section className="mt-20 md:mt-28">
          <SectionTitle eyebrow="INFORMATION" title="모임 안내" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Info icon={UsersRound} label="대상" value={audience || "누구나 참여할 수 있습니다"} />
            <Info icon={CalendarDays} label="요일" value={record?.meetingDay || "교회에 문의해 주세요"} />
            <Info icon={Clock3} label="시간" value={record?.meetingTime || "교회에 문의해 주세요"} />
            <Info icon={MapPin} label="장소" value={record?.location || "교회에 문의해 주세요"} />
          </div>
        </section>
        {programs.length ? (
          <section className="mt-16 rounded-[2rem] bg-primary-50 p-7 md:p-10">
            <h2 className="text-2xl font-extrabold">{name} 프로그램</h2>
            <ul className="mt-5 grid gap-3 text-text-secondary sm:grid-cols-2">
              {programs.map((program) => <li key={program}>• {program}</li>)}
            </ul>
          </section>
        ) : null}
        {record?.leader || (record?.showContact && record.contactValue) ? <section className="mt-16 rounded-2xl border border-border p-7"><SectionTitle eyebrow="CONTACT" title="담당 및 문의" /><dl className="mt-6 grid gap-3 sm:grid-cols-[8rem_1fr]">{record.leader ? <><dt className="font-bold text-text-secondary">담당자</dt><dd className="font-extrabold">{record.leader}</dd></> : null}{record.showContact && record.contactValue ? <><dt className="font-bold text-text-secondary">문의</dt><dd className="font-extrabold">{record.contactName ? `${record.contactName} · ` : ""}{record.contactValue}</dd></> : null}</dl></section> : null}
      </ContentShell>
    </>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <Icon aria-hidden="true" className="size-6 text-primary-600" />
      <p className="mt-5 text-sm font-bold text-text-secondary">{label}</p>
      <p className="mt-1 font-extrabold">{value}</p>
    </div>
  );
}
