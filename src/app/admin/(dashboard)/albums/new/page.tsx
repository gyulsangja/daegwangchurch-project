import { AlbumForm } from "@/components/admin/album-form";

export default function NewAlbumPage() {
  return <div className="mx-auto max-w-[90rem]"><p className="text-sm font-bold text-primary-700">NEW ALBUM</p><h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em]">행사앨범 등록</h1><p className="mt-2 text-text-secondary">행사 정보와 사진 여러 장을 한 번에 등록합니다.</p><AlbumForm /></div>;
}

