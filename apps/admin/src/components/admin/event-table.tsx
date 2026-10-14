import { ContentBoard } from "./content-board";
import { eventStatusLabels } from "@daegwang/contracts/features/events/schema";
type EventRow = {
  id: string;
  title: string;
  category: string;
  startsAt: Date;
  isAllDay: boolean;
  location: string | null;
  status: keyof typeof eventStatusLabels;
};

export function EventTable({ rows }: { rows: EventRow[] }) {
 return <ContentBoard kind="events" items={rows.map(row => ({ id: row.id, title: row.title, date: row.startsAt.toISOString(), status: row.status, statusLabel: eventStatusLabels[row.status], category: row.category, description: [row.isAllDay ? "종일" : row.startsAt.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }), row.location].filter(Boolean).join(" · "), }))} />;
}
