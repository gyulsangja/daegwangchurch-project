import { z } from 'zod';
import type { NotificationPreferences } from '@daegwang/contracts/features/member/extras';
export const notificationKeys = ['devotional', 'worship', 'notices', 'events', 'schedules'] as const;
export type NotificationKey = typeof notificationKeys[number];
export function activationTimes(raw: unknown): Partial<Record<NotificationKey, string>> {
  const object = z.record(z.string(), z.unknown()).safeParse(raw);
  return Object.fromEntries(notificationKeys.flatMap(key => {
    const value = z.iso.datetime().safeParse(object.success ? object.data[key] : undefined);
    return value.success ? [[key, value.data]] : [];
  }));
}
export function nextActivationTimes(previous: Omit<NotificationPreferences, 'version'>, next: Omit<NotificationPreferences, 'version'>, raw: unknown, savedAt: Date, now: Date) {
  const before = activationTimes(raw);
  return Object.fromEntries(notificationKeys.filter(key => next[key]).map(key => [key, previous[key] ? before[key] ?? savedAt.toISOString() : now.toISOString()]));
}
