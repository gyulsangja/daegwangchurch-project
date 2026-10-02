import { notFound } from "next/navigation";
import { HistoryForm } from "../../../../../../../components/admin/history-form";
import { ConfirmSubmitButton } from "../../../../../../../components/admin/confirm-submit-button";
import { deleteHistoryAction } from "../../../../../../../features/history/actions";
import { getAdminHistoryItem } from "@daegwang/server/features/history/queries";
export default async function EditHistoryPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const item = await getAdminHistoryItem(id); if (!item) notFound(); return <div className="mx-auto max-w-[90rem]"><div className="flex items-end justify-between"><div><p className="text-sm font-bold text-primary-700">EDIT HISTORY</p><h1 className="mt-1 text-3xl font-extrabold">연혁 수정</h1></div><form action={deleteHistoryAction.bind(null, id)}><ConfirmSubmitButton /></form></div><HistoryForm initialValues={{ ...item, content: item.content ?? "" }} /></div>; }
