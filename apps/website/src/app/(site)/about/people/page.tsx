import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import type { Metadata } from "next";
import { Quote, UserRound } from "lucide-react";
import Image from "next/image";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { getCareerLines, getVisiblePeople } from "@daegwang/server/features/people/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "섬기는 사람들",
  description: "대광교회를 섬기는 목회자와 사역자를 소개합니다.",
  alternates: { canonical: "/about/people" },
};

function ProfileImage({ name, position, image }: { name: string; position: string; image: { bucket: string; objectPath: string; altText: string | null } | null }) {
  if (image) return <Image src={getPublicStorageUrl(image.bucket, image.objectPath)} alt={image.altText ?? `${name} ${position}`} width={800} height={1000} className="aspect-[4/5] h-full w-full object-cover" />;
  return <div className="flex aspect-[4/5] h-full w-full items-center justify-center bg-background-muted"><UserRound aria-hidden="true" className="size-16 text-primary-600" /></div>;
}

export default async function PeoplePage() {
  const people = await getVisiblePeople();
  const seniorPastor = people.find((person) => person.isSeniorPastor);
  const ministryTeam = people.filter((person) => person.id !== seniorPastor?.id);

  return (
    <>
      <PageHero eyebrow="PEOPLE" title="함께 예배하고 섬기는 사람들" description="말씀과 사랑으로 교회와 성도를 섬깁니다." />
      <ContentShell>
        {seniorPastor ? (
          <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div className="overflow-hidden rounded-[2rem]"><ProfileImage name={seniorPastor.name} position={seniorPastor.position} image={seniorPastor.profileImage} /></div>
            <div>
              <p className="text-sm font-bold tracking-[0.12em] text-primary-700">SENIOR PASTOR</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.045em]">{seniorPastor.name} {seniorPastor.position}</h2>
              {seniorPastor.ministry ? <p className="mt-3 font-bold text-primary-700">{seniorPastor.ministry}</p> : null}
              {seniorPastor.quote ? <blockquote className="mt-6 flex gap-3 rounded-2xl bg-primary-50 p-5 text-lg font-bold leading-8 text-primary-900"><Quote aria-hidden="true" className="mt-1 size-6 shrink-0" />{seniorPastor.quote}</blockquote> : null}
              {seniorPastor.introduction ? <p className="mt-6 whitespace-pre-wrap text-lg leading-9 text-text-secondary">{seniorPastor.introduction}</p> : null}
              {getCareerLines(seniorPastor.career).length ? <ul className="mt-6 grid gap-2 text-sm text-text-secondary">{getCareerLines(seniorPastor.career).map((career) => <li key={career}>• {career}</li>)}</ul> : null}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-background-warm px-6 py-12 text-center text-text-secondary">담임목사 정보를 등록하면 이곳에 표시됩니다.</div>
        )}

        <section className="mt-20 md:mt-28">
          <SectionTitle eyebrow="MINISTRY TEAM" title="교역자와 사역자" description="각자의 자리에서 예배와 공동체를 섬기고 있습니다." />
          {ministryTeam.length ? (
            <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ministryTeam.map((person) => (
                <Card component="article" key={person.id} className="overflow-hidden">
                  <div className="overflow-hidden"><ProfileImage name={person.name} position={person.position} image={person.profileImage} /></div>
                  <CardContent className="p-6!">
                    <div className="flex flex-wrap items-center gap-2"><Chip label={person.position} color="primary" variant="outlined" />{person.ministry ? <Chip label={person.ministry} variant="outlined" /> : null}</div>
                    <h3 className="mt-5 text-2xl font-extrabold">{person.name}</h3>
                    {person.introduction ? <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{person.introduction}</p> : null}
                    {getCareerLines(person.career).length ? <ul className="mt-4 grid gap-1 text-xs text-text-secondary">{getCareerLines(person.career).slice(0, 4).map((career) => <li key={career}>• {career}</li>)}</ul> : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : <div className="mt-9 rounded-2xl border border-dashed border-border bg-background-warm px-6 py-12 text-center text-text-secondary">공개된 교역자 정보가 없습니다.</div>}
        </section>
      </ContentShell>
    </>
  );
}

