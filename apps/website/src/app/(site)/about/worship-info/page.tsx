import type { Metadata } from "next";
import { Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import { ContentShell, SectionTitle } from "../../../../components/site/content-shell";
import { PageHero } from "../../../../components/site/page-hero";
import { Button } from "@daegwang/web-ui/components/ui/button";
import { getPublicSchedules } from "@daegwang/server/features/schedules/queries";

export const metadata: Metadata = {
  title: "예배안내",
  description: "대광교회의 주일예배와 주중 예배를 안내합니다.",
  alternates: { canonical: "/about/worship-info" },
};

export const dynamic = "force-dynamic";

export default async function WorshipInfoPage() {
  const schedules = await getPublicSchedules();
  return (
    <>
      <PageHero
        eyebrow="WORSHIP INFORMATION"
        title="예배의 자리로 초대합니다"
        description="하나님을 예배하며 말씀 안에서 함께 회복되는 시간입니다."
      />
      <ContentShell>
        <SectionTitle eyebrow="WEEKLY WORSHIP" title="예배 시간" />
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {schedules.map((schedule) => (
            <article key={schedule.id} className="rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <Clock3 aria-hidden="true" className="size-5" />
                </span>
                <h2 className="text-xl font-extrabold">{schedule.name}</h2>
              </div>
              <dl className="mt-5 grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
                <dt className="font-bold text-text-secondary">시간</dt>
                <dd>{schedule.dayLabel} · {schedule.timeLabel}</dd>
                <dt className="font-bold text-text-secondary">장소</dt>
                <dd>{schedule.location || "교회에 문의해 주세요"}</dd>
              </dl>
              {schedule.note ? <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-text-secondary">{schedule.note}</p> : null}
            </article>
          ))}
          {schedules.length === 0 ? <div className="rounded-2xl border border-border p-8 text-text-secondary md:col-span-2">예배시간을 준비하고 있습니다.</div> : null}
        </div>
        <aside className="mt-12 flex flex-col gap-6 rounded-2xl bg-primary-50 p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <MapPin aria-hidden="true" className="mt-1 size-6 shrink-0 text-primary-700" />
            <div>
              <h2 className="font-extrabold">처음 방문하시나요?</h2>
              <p className="mt-1 text-text-secondary">오시는 길과 새가족 안내를 미리 확인해 보세요.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link href="/location">오시는 길</Link></Button>
            <Button asChild><Link href="/newcomer/guide">새가족 안내</Link></Button>
          </div>
        </aside>
      </ContentShell>
    </>
  );
}
