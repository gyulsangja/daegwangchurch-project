import Chip from "@mui/material/Chip";
import { ArrowLeft, CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import Link from "next/link";

import { ContentShell } from "../site/content-shell";

type EventDetail = {
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  ministryName: string;
  description: string;
};

export function EventDetailPage({ event }: { event: EventDetail }) {
  return (
    <ContentShell narrow>
      <Link href="/news/events" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full font-bold text-text-secondary hover:text-primary-700"><ArrowLeft aria-hidden="true" className="size-4" /> 목록으로</Link>
      <article className="mt-8">
        <header className="border-b border-border pb-8">
          <Chip label={event.category} color="primary" variant="outlined" />
          <h1 className="text-balance mt-5 text-4xl font-extrabold tracking-[-0.05em] md:text-5xl">{event.title}</h1>
          <dl className="mt-7 grid gap-4 rounded-2xl bg-background-muted p-5 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 size-5 text-primary-600" /><div><dt className="font-bold">날짜</dt><dd className="mt-1 text-text-secondary">{event.date}</dd></div></div>
            <div className="flex items-start gap-3"><Clock3 aria-hidden="true" className="mt-0.5 size-5 text-primary-600" /><div><dt className="font-bold">시간</dt><dd className="mt-1 text-text-secondary">{event.time}</dd></div></div>
            {event.location ? <div className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 size-5 text-primary-600" /><div><dt className="font-bold">장소</dt><dd className="mt-1 text-text-secondary">{event.location}</dd></div></div> : null}
            {event.ministryName ? <div className="flex items-start gap-3"><UsersRound aria-hidden="true" className="mt-0.5 size-5 text-primary-600" /><div><dt className="font-bold">담당</dt><dd className="mt-1 text-text-secondary">{event.ministryName}</dd></div></div> : null}
          </dl>
        </header>
        <div className="whitespace-pre-wrap py-10 text-lg leading-9 text-text-secondary">{event.description || "상세 안내가 준비 중입니다."}</div>
      </article>
    </ContentShell>
  );
}

