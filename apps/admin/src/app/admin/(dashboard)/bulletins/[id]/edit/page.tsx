import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";

import { BulletinForm } from "../../../../../../components/admin/bulletin-form";
import { ConfirmSubmitButton } from "../../../../../../components/admin/confirm-submit-button";
import { deleteBulletinAction } from "../../../../../../features/bulletins/actions";
import { getAdminBulletin } from "@daegwang/server/features/bulletins/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type Props = { params: Promise<{ id: string }> };

export default async function EditBulletinPage({ params }: Props) {
  const { id } = await params;
  const bulletin = await getAdminBulletin(id);
  if (!bulletin) notFound();
  const deleteAction = deleteBulletinAction.bind(null, id);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">EDIT BULLETIN</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">주보 수정</h1></div>
        <form action={deleteAction}><ConfirmSubmitButton /></form>
      </div>
      <Alert severity="info" className="mt-6!">새 PDF를 선택하지 않으면 기존 파일을 유지합니다.</Alert>
      <BulletinForm initialValues={{
        id: bulletin.id,
        title: bulletin.title,
        worshipDate: bulletin.worshipDate.toISOString().slice(0, 10),
        summary: bulletin.summary ?? "",
        status: bulletin.status,
        pdfName: bulletin.pdfMedia.originalName,
        pdfUrl: getPublicStorageUrl(bulletin.pdfMedia.bucket, bulletin.pdfMedia.objectPath),
      }} />
    </div>
  );
}
