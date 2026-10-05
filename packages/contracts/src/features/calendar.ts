import { z } from 'zod';
export const monthSchema = z.string().regex(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/);
export function monthBounds(value: string) {
  const month = monthSchema.parse(value); const [year, m] = month.split('-').map(Number);
  const start = new Date(`${month}-01T00:00:00+09:00`);
  const end = new Date(Date.UTC(year, m, 1) - 9 * 3600000);
  return { start, end };
}
export function monthDates(month: string) {
  monthSchema.parse(month); const [year, m] = month.split('-').map(Number);
  return Array.from({ length: new Date(Date.UTC(year, m, 0)).getUTCDate() }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}
export function eventOnDay(event: { startsAt: string; endsAt: string | null; isAllDay: boolean }, date: string) {
  const start = new Date(`${date}T00:00:00+09:00`).getTime(); const end = start + 86400000;
  const from = new Date(event.startsAt).getTime(); const to = event.endsAt ? new Date(event.endsAt).getTime() : null;
  return from < end && (to === null ? from >= start : event.isAllDay ? to >= start : to > start);
}
