import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventDetailPage } from "@/components/content/event-detail-page";
import { getEventDescription, getPublishedEventBySlug } from "@/features/events/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return { title: "교회 일정" };
  return {
    title: event.title,
    description: getEventDescription(event.description).replace(/\s+/g, " ").slice(0, 160) || `${event.startsAt.toLocaleDateString("ko-KR")} 교회 일정`,
    alternates: { canonical: `/news/events/${event.slug}` },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const dateOptions: Intl.DateTimeFormatOptions = { dateStyle: "long" };
  const timeOptions: Intl.DateTimeFormatOptions = { timeStyle: "short" };
  const date = event.endsAt
    ? `${event.startsAt.toLocaleDateString("ko-KR", dateOptions)} ~ ${event.endsAt.toLocaleDateString("ko-KR", dateOptions)}`
    : event.startsAt.toLocaleDateString("ko-KR", dateOptions);
  const time = event.isAllDay
    ? "종일"
    : event.endsAt
      ? `${event.startsAt.toLocaleTimeString("ko-KR", timeOptions)} ~ ${event.endsAt.toLocaleTimeString("ko-KR", timeOptions)}`
      : event.startsAt.toLocaleTimeString("ko-KR", timeOptions);

  return <EventDetailPage event={{
    title: event.title,
    category: event.category,
    date,
    time,
    location: event.location ?? "",
    ministryName: event.ministryName ?? "",
    description: getEventDescription(event.description),
  }} />;
}

