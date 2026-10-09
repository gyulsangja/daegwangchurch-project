import 'server-only';
import { getPrisma } from '@daegwang/database/prisma';
import { hasDatabaseConfig } from '@daegwang/config/env';

export async function getDashboardSummary() {
  const fallback = { latestSunday: '등록된 설교 없음', latestFirstHour: '등록된 첫시간 없음', latestNotice: '등록된 공지 없음', latestBulletin: '등록된 주보 없음', nextEvent: '예정된 일정 없음', unavailable: false };
  if (!hasDatabaseConfig()) return { ...fallback, unavailable: true };
  try {
    const db = getPrisma();
    const [sunday, firstHour, notice, bulletin, event] = await Promise.all([
      db.worshipContent.findFirst({ where: { type: 'SUNDAY_MORNING', deletedAt: null }, orderBy: [{ contentDate: 'desc' }, { id: 'desc' }], select: { title: true } }),
      db.worshipContent.findFirst({ where: { type: 'FIRST_HOUR', deletedAt: null }, orderBy: [{ contentDate: 'desc' }, { id: 'desc' }], select: { title: true } }),
      db.notice.findFirst({ where: { deletedAt: null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { title: true } }),
      db.bulletin.findFirst({ where: { deletedAt: null }, orderBy: [{ worshipDate: 'desc' }, { id: 'desc' }], select: { title: true } }),
      db.event.findFirst({ where: { deletedAt: null, startsAt: { gte: new Date() } }, orderBy: [{ startsAt: 'asc' }, { id: 'asc' }], select: { title: true } }),
    ]);
    return { latestSunday: sunday?.title ?? fallback.latestSunday, latestFirstHour: firstHour?.title ?? fallback.latestFirstHour, latestNotice: notice?.title ?? fallback.latestNotice, latestBulletin: bulletin?.title ?? fallback.latestBulletin, nextEvent: event?.title ?? fallback.nextEvent, unavailable: false };
  } catch {
    console.error('Failed to load content home');
    return { ...fallback, unavailable: true };
  }
}
