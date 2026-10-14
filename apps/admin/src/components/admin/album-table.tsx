import { ContentBoard } from "./content-board";
import { albumStatusLabels } from "@daegwang/contracts/features/albums/schema";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";
type AlbumRow = {
  id: string;
  title: string;
  category: string;
  eventDate: Date;
  status: keyof typeof albumStatusLabels;
  showOnMain: boolean;
  coverImage: { bucket: string; objectPath: string; altText: string | null } | null;
  images: Array<{ id: string }>;
};

export function AlbumTable({ rows }: { rows: AlbumRow[] }) {
 return <ContentBoard kind="albums" items={rows.map(row => ({ id: row.id, title: row.title, date: row.eventDate.toISOString(), status: row.status, statusLabel: albumStatusLabels[row.status], category: row.category, description: `${row.images.length}장${row.showOnMain ? ' · 홈 노출' : ''}`, image: row.coverImage ? getPublicStorageUrl(row.coverImage.bucket, row.coverImage.objectPath) : undefined, }))} />;
}
