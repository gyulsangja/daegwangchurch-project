import Alert from "@mui/material/Alert";
import { notFound } from "next/navigation";

import { AlbumForm } from "@/components/admin/album-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteAlbumAction } from "@/features/albums/actions";
import { getAdminAlbum } from "@/features/albums/queries";
import { getPublicStorageUrl } from "@/lib/storage/public-url";

type Props = { params: Promise<{ id: string }> };

export default async function EditAlbumPage({ params }: Props) {
  const { id } = await params;
  const album = await getAdminAlbum(id);
  if (!album) notFound();
  const deleteAction = deleteAlbumAction.bind(null, id);
  return (
    <div className="mx-auto max-w-[90rem]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold text-primary-700">EDIT ALBUM</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">행사앨범 수정</h1></div>
        <form action={deleteAction}><ConfirmSubmitButton /></form>
      </div>
      <Alert severity="info" className="mt-6!">사진 삭제와 대표 사진 변경은 아래에서 선택한 뒤 저장해야 반영됩니다.</Alert>
      <AlbumForm initialValues={{
        id: album.id,
        title: album.title,
        eventDate: album.eventDate.toISOString().slice(0, 10),
        category: album.category,
        description: album.description ?? "",
        status: album.status,
        showOnMain: album.showOnMain,
        images: album.images.map((image) => ({
          id: image.id,
          mediaId: image.mediaId,
          name: image.media.originalName,
          url: getPublicStorageUrl(image.media.bucket, image.media.objectPath),
          isCover: image.mediaId === album.coverImageId,
          caption: image.caption ?? "",
          altText: image.media.altText ?? "",
        })),
      }} />
    </div>
  );
}
