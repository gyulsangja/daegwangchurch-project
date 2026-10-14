import { ContentBoard } from "./content-board";
import { bulletinStatusLabels } from "@daegwang/contracts/features/bulletins/schema";
import { getPublicStorageUrl } from "@daegwang/web-ui/lib/storage/public-url";
type BulletinRow = {
  id: string;
  title: string;
  worshipDate: Date;
  status: keyof typeof bulletinStatusLabels;
  pdfMedia: { bucket: string; objectPath: string; originalName: string };
};

export function BulletinTable({ rows }: { rows: BulletinRow[] }) {
 return <ContentBoard kind="bulletins" items={rows.map(row => ({ id: row.id, title: row.title, date: row.worshipDate.toISOString(), status: row.status, statusLabel: bulletinStatusLabels[row.status], file: getPublicStorageUrl(row.pdfMedia.bucket, row.pdfMedia.objectPath), }))} />;
}
