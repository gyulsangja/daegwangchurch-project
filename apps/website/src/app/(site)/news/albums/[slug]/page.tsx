import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AlbumDetailPage } from "../../../../../components/content/album-detail-page";
import { getPublishedAlbumBySlug } from "@daegwang/server/features/albums/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album = await getPublishedAlbumBySlug(slug);
  if (!album) return { title: "행사앨범" };
  return { title: album.title, description: album.description ?? `${album.eventDate.toLocaleDateString("ko-KR")} 행사앨범`, alternates: { canonical: `/news/albums/${album.slug}` } };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const album = await getPublishedAlbumBySlug(slug);
  if (!album) notFound();
  return <AlbumDetailPage album={{
    title: album.title,
    category: album.category,
    date: album.eventDate.toLocaleDateString("ko-KR"),
    description: album.description ?? "",
    images: album.images.map((image) => ({
      id: image.id,
      url: getPublicStorageUrl(image.media.bucket, image.media.objectPath),
      alt: image.media.altText ?? `${album.title} 사진`,
      caption: image.caption ?? "",
    })),
  }} />;
}

