import type { Metadata } from "next";

import { AlbumListPage } from "../../../../components/content/album-list-page";
import { getPublishedAlbums } from "@daegwang/server/features/albums/queries";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";

export const metadata: Metadata = { title: "행사앨범", description: "대광교회 예배와 행사, 공동체 모임의 사진을 앨범별로 확인하세요. 행사 날짜와 제목을 살펴보고 앨범을 열어 사진을 볼 수 있습니다.", alternates: { canonical: "/news/albums" } };

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

