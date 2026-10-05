import { z } from 'zod';
import type { Prisma, PrismaClient } from '@daegwang/database/generated/client';
import { preferenceInputSchema, type MemberNotification } from '@daegwang/contracts/features/member/extras';
import { appWorshipSnapshotSchema } from '@daegwang/contracts/features/worship/app-contract';
import { personalScheduleSchema } from '@daegwang/contracts/features/member/schedules';
import { publishedNoticeWhere } from '../notices/public-policy';
import { publishedEventWhere } from '../events/public-policy';
import { eventOnDateWhere, upcomingEventWhere } from '../events/app-query-core';
import { worshipVisibility } from '../worship/public-query-core';
import { createAppWorshipQueries } from '../worship/app-query-core';
import { createNotificationServices } from './notification-service';
import { activationTimes, type NotificationKey } from './notification-activation';

export type NotificationSources = { worship: boolean; notices: boolean; events: boolean; schedules: boolean; push?: boolean };
const dayMs = 86400000;
const koreaDate = (time: Date) => new Date(time.getTime() + 9 * 3600000).toISOString().slice(0, 10);
const later = (...dates: Date[]) => new Date(Math.max(...dates.map(date => date.getTime())));

export function createAutomaticNotificationService(db: PrismaClient, identity: string, sources: NotificationSources, now = () => new Date()) {
  const ownerId = z.uuid().parse(identity); const base = createNotificationServices(db, ownerId, now).notification;
  async function synchronize() {
    const time = now(); const cutoff = new Date(time.getTime() - 30 * dayMs); const date = koreaDate(time);
    await db.$transaction(async tx => {
      // Serialize with preference writes and deletion; no network calls inside this transaction.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
      if (await tx.memberDeletion.findUnique({ where: { ownerId }, select: { ownerId: true } })) return;
      const row = await tx.memberNotificationPreference.findUnique({ where: { ownerId } });
      if (!row) return;
      const prefs = preferenceInputSchema.parse(row.content); const activated = activationTimes(row.activationTimes);
      const since = (key: NotificationKey) => later(cutoff, new Date(activated[key] ?? row.updatedAt.toISOString()));
      const data: Prisma.MemberNotificationCreateManyInput[] = [];
      function add(key: NotificationKey, due: Date, sourceKey: string, category: string, target: NonNullable<MemberNotification['target']>, title: string, body: string) {
        if (!prefs[key] || due < since(key) || due > time) return;
        data.push({ ownerId, dedupeKey: `auto:${sourceKey}`, category, target, title, body, createdAt: due });
      }
      if (sources.worship && (prefs.devotional || prefs.worship)) {
        const words = await tx.worshipPublication.findMany({ where: { channel: 'APP', startsAt: { lte: time }, OR: [{ endsAt: null }, { endsAt: { gt: time } }], worshipContent: worshipVisibility(time), AND: [{ OR: [{ startsAt: { gte: cutoff } }, { publishedRevision: { type: 'FIRST_HOUR', payload: { path: ['contentDate'], gte: koreaDate(cutoff) } } }] }] }, select: { worshipContentId: true, startsAt: true, publishedRevision: { select: { payload: true } } }, orderBy: [{ startsAt: 'desc' }, { worshipContentId: 'desc' }], take: 500 });
        for (const word of words) {
          const parsed = appWorshipSnapshotSchema.safeParse(word.publishedRevision.payload); if (!parsed.success) continue;
          const devotional = parsed.data.type === 'FIRST_HOUR';
          const due = devotional ? later(word.startsAt, new Date(`${parsed.data.contentDate}T${prefs.devotionalTime}:00+09:00`)) : word.startsAt;
          add(devotional ? 'devotional' : 'worship', due, `word:${word.worshipContentId}`, 'WORD', { kind: devotional ? 'devotional' : 'sermons', id: word.worshipContentId }, devotional ? '첫시간 말씀이 준비되었습니다' : '예배 말씀이 등록되었습니다', '말씀을 듣고 오늘의 묵상을 이어가세요.');
        }
      }
      if (sources.notices && prefs.notices) {
        const notices = await tx.notice.findMany({ where: { ...(sources.push ? { isImportant: true } : {}), AND: [publishedNoticeWhere(time), { OR: [{ publishedAt: { gte: since('notices') } }, { publishStartsAt: { gte: since('notices') } }, { publishedAt: null, createdAt: { gte: since('notices') } }] }] }, select: { id: true, publishedAt: true, publishStartsAt: true, createdAt: true }, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: 500 });
        for (const notice of notices) add('notices', later(notice.publishedAt ?? notice.createdAt, notice.publishStartsAt ?? notice.publishedAt ?? notice.createdAt), `notice:${notice.id}`, 'NEWS', { kind: 'notices', id: notice.id }, '교회 공지가 등록되었습니다', '교회에서 전하는 소식을 확인해 주세요.');
      }
      if (sources.events && prefs.events) {
        const events = await tx.event.findMany({ where: { AND: [publishedEventWhere(time), upcomingEventWhere(time), { OR: [{ publishedAt: { gte: since('events') } }, { publishedAt: null, createdAt: { gte: since('events') } }] }] }, select: { id: true, publishedAt: true, createdAt: true }, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: 500 });
        for (const event of events) add('events', event.publishedAt ?? event.createdAt, `event:${event.id}`, 'NEWS', { kind: 'events', id: event.id }, '교회 행사가 등록되었습니다', '일정과 안내를 확인해 주세요.');
      }
      if (sources.schedules && prefs.schedules) {
        const start = new Date(`${date}T00:00:00+09:00`); const end = new Date(start.getTime() + dayMs);
        const schedules = await tx.memberSchedule.findMany({ where: { ownerId, OR: [{ eventId: null, startsAt: { gte: start, lt: end }, endsAt: { gt: time } }, ...(sources.events ? [{ event: { AND: [publishedEventWhere(time), upcomingEventWhere(time), { startsAt: { gte: start, lt: end } }] } }] : [])] }, select: { id: true, createdAt: true }, orderBy: { id: 'asc' }, take: 500 });
        for (const schedule of schedules) add('schedules', later(start, since('schedules'), schedule.createdAt), `schedule:${schedule.id}:${date}`, 'SCHEDULE', { kind: 'schedules', id: schedule.id }, '오늘 예정된 일정이 있습니다', '나의 일정에서 시간을 확인해 주세요.');
      }
      if (data.length) await tx.memberNotification.createMany({ data, skipDuplicates: true });
    }, { timeout: 15000 });
  }
  async function present(item: MemberNotification): Promise<MemberNotification> {
    const target = item.target; if (!target) return item;
    const time = now(); let title: string | null = null;
    if (['devotional', 'sermons'].includes(target.kind) && sources.worship) {
      const word = await createAppWorshipQueries(db, now).detail(target.id);
      if (word && (word.type === 'FIRST_HOUR') === (target.kind === 'devotional')) title = word.title;
    } else if (target.kind === 'notices' && sources.notices) {
      title = (await db.notice.findFirst({ where: { ...publishedNoticeWhere(time), id: target.id }, select: { title: true } }))?.title ?? null;
    } else if (target.kind === 'events' && sources.events) {
      title = (await db.event.findFirst({ where: { ...publishedEventWhere(time), id: target.id }, select: { title: true } }))?.title ?? null;
    } else if (target.kind === 'schedules' && sources.schedules) {
      const row = await db.memberSchedule.findFirst({ where: { ownerId, id: target.id }, select: { content: true, eventId: true, startsAt: true } });
      const notificationDay = koreaDate(new Date(item.createdAt));
      if (row?.eventId && sources.events) {
        title = (await db.event.findFirst({ where: { AND: [publishedEventWhere(time), { id: row.eventId }, eventOnDateWhere(notificationDay)] }, select: { title: true } }))?.title ?? null;
      } else if (row && row.startsAt && koreaDate(row.startsAt) === notificationDay) {
        const parsed = personalScheduleSchema.safeParse(row.content); title = parsed.success ? parsed.data.title : null;
      }
    }
    if (!title) return { ...item, title: '현재 확인할 수 없는 알림', body: '연결된 내용이 변경되었거나 더 이상 제공되지 않습니다.', target: null };
    return { ...item, title };
  }
  return {
    synchronize,
    async list(input: unknown) {
      // Validate before doing any work, including rejecting unknown query fields.
      const query = z.object({ page: z.coerce.number().int().min(0).max(10000).optional(), category: z.enum(['ALL','WORD','NEWS','SCHEDULE']).optional() }).strict().parse(input);
      if (!query.page && !sources.push) await synchronize(); const page = await base.list(input);
      return { ...page, data: await Promise.all(page.data.map(present)) };
    },
    async detail(id: string) { return present(await base.detail(id)); },
    async update(id: string, input: unknown) { return present(await base.update(id, input)); },
    create: base.create, remove: base.remove,
  };
}
