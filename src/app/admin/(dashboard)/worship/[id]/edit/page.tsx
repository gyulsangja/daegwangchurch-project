import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";

import { WorshipForm } from "@/components/admin/worship-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteWorshipAction } from "@/features/worship/actions";
import { getAdminWorshipContent } from "@/features/worship/queries";

type Props = { params: Promise<{ id: string }> };

export default async function EditWorshipPage({ params }: Props) {
  const { id } = await params;
  const content = await getAdminWorshipContent(id);
  if (!content) notFound();
  const deleteAction = deleteWorshipAction.bind(null, id);

  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-primary-700">EDIT WORSHIP CONTENT</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">예배 콘텐츠 수정</h1>
        </div>
        <form action={deleteAction}>
          <ConfirmSubmitButton />
        </form>
      </div>
      <Alert severity="info" className="mt-6!">삭제하면 목록과 공개 페이지에서 즉시 숨겨지며 DB에는 복구 가능한 상태로 보존됩니다.</Alert>
      <WorshipForm initialValues={{
        id: content.id,
        type: content.type,
        title: content.title,
        contentDate: content.contentDate.toISOString().slice(0, 10),
        youtubeUrl: content.youtubeUrl,
        preacher: content.preacher ?? "",
        sermonTitle: content.sermonTitle ?? "",
        scripture: content.scripture ?? "",
        description: content.description ?? "",
        summary: content.summary ?? "",
        status: content.status,
        isPinned: content.isPinned,
      }} />
    </div>
  );
}
