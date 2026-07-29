import type { Metadata } from "next";

import { AlbumListPage } from "@/components/content/album-list-page";
import { getPublishedAlbums } from "@/features/albums/queries";
import { getPublicStorageUrl } from "@/lib/storage/public-url";

export const metadata: Metadata = { title: "행사앨범", description: "독산대광교회 공동체의 행사 사진을 확인하세요.", alternates: { canonical: "/news/albums" } };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AlbumsPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const albums = await getPublishedAlbums(q);
  const items = albums.map((album) => ({
    slug: album.slug,
    title: album.title,
    category: album.category,
    date: album.eventDate.toLocaleDateString("ko-KR"),
    description: album.description ?? "",
    imageCount: album.images.length,
    coverUrl: album.coverImage ? getPublicStorageUrl(album.coverImage.bucket, album.coverImage.objectPath) : "",
  }));
  return <AlbumListPage items={items} query={q} />;
}

