import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";

import { NoticeForm } from "../../../../../../components/admin/notice-form";
import { ConfirmSubmitButton } from "../../../../../../components/admin/confirm-submit-button";
import { deleteNoticeAction } from "../../../../../../features/notices/actions";
import { getAdminNotice, getNoticeBody } from "@daegwang/server/features/notices/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type Props = { params: Promise<{ id: string }> };

function toDateTimeLocal(value: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export default async function EditNoticePage({ params }: Props) {
  const { id } = await params;
  const notice = await getAdminNotice(id);
  if (!notice) notFound();
  const deleteAction = deleteNoticeAction.bind(null, id);

  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">EDIT NOTICE</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">공지사항 수정</h1></div>
        <form action={deleteAction}><ConfirmSubmitButton /></form>
      </div>
      <Alert severity="info" className="mt-6!">삭제한 공지는 공개 목록에서 숨겨지며 데이터는 복구 가능한 상태로 보관됩니다.</Alert>
      <NoticeForm initialValues={{
        id: notice.id,
        title: notice.title,
        category: notice.category,
        body: getNoticeBody(notice.content),
        status: notice.status,
        isImportant: notice.isImportant,
        isPinned: notice.isPinned,
        publishStartsAt: toDateTimeLocal(notice.publishStartsAt),
        publishEndsAt: toDateTimeLocal(notice.publishEndsAt),
        attachments: notice.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.media.originalName,
          sizeBytes: attachment.media.sizeBytes,
          url: getPublicStorageUrl(attachment.media.bucket, attachment.media.objectPath),
        })),
      }} />
    </div>
  );
}
