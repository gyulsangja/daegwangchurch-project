import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";

import { EventForm } from "@/components/admin/event-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteEventAction } from "@/features/events/actions";
import { getAdminEvent, getEventDescription } from "@/features/events/queries";

type Props = { params: Promise<{ id: string }> };

function toDateTimeLocal(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const event = await getAdminEvent(id);
  if (!event) notFound();
  const deleteAction = deleteEventAction.bind(null, id);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">EDIT EVENT</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">교회 일정 수정</h1></div>
        <form action={deleteAction}><ConfirmSubmitButton /></form>
      </div>
      <Alert severity="info" className="mt-6!">삭제한 일정은 공개 목록에서 숨겨지며 DB에는 복구 가능한 상태로 보관됩니다.</Alert>
      <EventForm initialValues={{
        id: event.id,
        title: event.title,
        category: event.category,
        startsAt: toDateTimeLocal(event.startsAt),
        endsAt: toDateTimeLocal(event.endsAt),
        isAllDay: event.isAllDay,
        location: event.location ?? "",
        ministryName: event.ministryName ?? "",
        description: getEventDescription(event.description),
        status: event.status,
      }} />
    </div>
  );
}
