import { notFound } from "next/navigation";
import { ScheduleForm } from "../../../../../../../components/admin/schedule-form";
import { ConfirmSubmitButton } from "../../../../../../../components/admin/confirm-submit-button";
import { deleteScheduleAction } from "../../../../../../../features/schedules/actions";
import { getAdminSchedule } from "@daegwang/server/features/schedules/queries";
export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const item = await getAdminSchedule(id); if (!item) notFound(); return <div className="mx-auto max-w-[90rem]"><div className="flex items-end justify-between"><div><p className="text-sm font-bold text-primary-700">EDIT SCHEDULE</p><h1 className="mt-1 text-3xl font-extrabold">예배시간 수정</h1></div><form action={deleteScheduleAction.bind(null, id)}><ConfirmSubmitButton /></form></div><ScheduleForm initialValues={{ ...item, location: item.location ?? "", note: item.note ?? "" }} /></div>; }
