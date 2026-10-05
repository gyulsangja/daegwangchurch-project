import type { PrismaClient, MemberNotification, MemberPushDevice } from '@daegwang/database/generated/client';
import { notificationSchema, preferenceInputSchema } from '@daegwang/contracts/features/member/extras';
import { personalScheduleSchema } from '@daegwang/contracts/features/member/schedules';
import { createAutomaticNotificationService, type NotificationSources } from './notification-sync';
import { activationTimes, type NotificationKey } from './notification-activation';
import { createAppWorshipQueries } from '../worship/app-query-core';
import { upcomingEventWhere } from '../events/app-query-core';

const dayMs = 86400000;
export const koreanDay = (date: Date) => new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 10);
export function afterQuietHours(date: Date) {
  const hour = new Date(date.getTime() + 9 * 3600000).getUTCHours();
  if (hour >= 8 && hour < 22) return date;
  const day = koreanDay(new Date(date.getTime() + (hour >= 22 ? dayMs : 0)));
  return new Date(`${day}T08:00:00+09:00`);
}
export type PushPlan = { due: Date; expires: Date; slotKey: string; general: boolean };
export async function planPush(db: PrismaClient, device: MemberPushDevice, row: MemberNotification, sources: NotificationSources, now: Date): Promise<PushPlan | null> {
  if (device.ownerId !== row.ownerId || device.expiresAt <= now || row.readAt || row.createdAt < device.enabledAt) return null;
  if (await db.memberDeletion.findUnique({ where: { ownerId: row.ownerId }, select: { ownerId: true } })) return null;
  const preference = await db.memberNotificationPreference.findUnique({ where: { ownerId: row.ownerId } });
  if (!preference) return null;
  const prefs = preferenceInputSchema.parse(preference.content);
  const parsed = notificationSchema.safeParse({ ...row, createdAt: row.createdAt.toISOString(), readAt: null });
  if (!parsed.success || !parsed.data.target) return null;
  const target = parsed.data.target;
  const key: NotificationKey = target.kind === 'sermons' ? 'worship' : target.kind;
  if (!prefs[key] || row.createdAt < new Date(activationTimes(preference.activationTimes)[key] ?? preference.updatedAt.toISOString())) return null;
  const current = await createAutomaticNotificationService(db, row.ownerId, sources, () => now).detail(row.id);
  if (!current.target) return null;
  let due = row.createdAt; let expires = new Date(due.getTime() + dayMs); let slotKey = row.id;
  const general = ['sermons', 'notices', 'events'].includes(target.kind);
  if (target.kind === 'notices' && !(await db.notice.findUnique({ where: { id: target.id }, select: { isImportant: true } }))?.isImportant) return null;
  if (target.kind === 'events' && !await db.event.findFirst({ where: { AND: [{ id: target.id }, upcomingEventWhere(now)] }, select: { id: true } })) return null;
  if (target.kind === 'devotional') {
    const word = await createAppWorshipQueries(db, () => now).detail(target.id);
    if (!word || word.contentDate !== koreanDay(now)) return null;
    due = new Date(Math.max(due.getTime(), new Date(`${word.contentDate}T${prefs.devotionalTime}:00+09:00`).getTime()));
    expires = new Date(new Date(`${word.contentDate}T00:00:00+09:00`).getTime() + dayMs);
    slotKey = `devotional:${word.contentDate}`;
  }
  if (target.kind === 'schedules') {
    const schedule = await db.memberSchedule.findFirst({ where: { id: target.id, ownerId: row.ownerId }, include: { event: true } });
    if (!schedule) return null;
    const personal = personalScheduleSchema.safeParse(schedule.content);
    const start = schedule.event?.startsAt ?? schedule.startsAt;
    const allDay = schedule.event?.isAllDay ?? (personal.success && personal.data.allDay);
    if (!start || koreanDay(start) !== koreanDay(row.createdAt)) return null;
    const midnight = new Date(`${koreanDay(start)}T00:00:00+09:00`);
    due = allDay ? new Date(`${koreanDay(start)}T08:00:00+09:00`) : new Date(Math.max(midnight.getTime(), start.getTime() - 1800000));
    expires = allDay ? new Date(midnight.getTime() + dayMs) : start;
  }
  if (general) due = afterQuietHours(new Date(Math.max(due.getTime(), now.getTime())));
  if (now >= expires || due >= expires) return null;
  return { due, expires, slotKey, general };
}
