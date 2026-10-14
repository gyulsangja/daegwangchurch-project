import { ContentBoard } from "./content-board";
import { noticeStatusLabels } from "@daegwang/contracts/features/notices/schema";
type NoticeRow = {
  id: string;
  title: string;
  category: string;
  status: keyof typeof noticeStatusLabels;
  isImportant: boolean;
  isPinned: boolean;
  createdAt: Date;
};

export function NoticeTable({ rows }: { rows: NoticeRow[] }) {
 return <ContentBoard kind="notices" items={rows.map(row => ({ id: row.id, title: row.title, date: row.createdAt.toISOString(), status: row.status, statusLabel: noticeStatusLabels[row.status], category: row.category, pinned: row.isPinned, description: row.isImportant ? "중요 공지" : "", }))} />;
}
