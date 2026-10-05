import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { defaultPreferences, notificationSchema, preferenceInputSchema, preferenceSchema, notificationCategorySchema } from '@daegwang/contracts/features/member/extras';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';
import { nextActivationTimes } from './notification-activation';
type Db = Pick<PrismaClient, 'memberNotification' | 'memberNotificationPreference'>;
const listSchema = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0), category: z.union([notificationCategorySchema, z.literal('ALL')]).default('ALL') }).strict();
const select = { id: true, category: true, title: true, body: true, target: true, createdAt: true, readAt: true } as const;
export function createNotificationServices(db: Db, identity: string, now = () => new Date()) {
  const ownerId = z.uuid().parse(identity);
  const unsupported = async () => { throw new Error('Unsupported member notification operation'); };
  const dto = (row: { createdAt: Date; readAt: Date | null }) => notificationSchema.parse({ ...row, createdAt: row.createdAt.toISOString(), readAt: row.readAt?.toISOString() ?? null });
  const notification = {
    async list(input: unknown) { const query = listSchema.parse(input); const rows = await db.memberNotification.findMany({ where: { ownerId, ...(query.category === 'ALL' ? {} : { category: query.category }) }, select, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: query.page * 20, take: 21 }); return { data: rows.slice(0, 20).map(dto), nextPage: rows.length > 20 ? query.page + 1 : null }; },
    async detail(id: string) { const row = await db.memberNotification.findFirst({ where: { ownerId, id }, select }); if (!row) throw new MemberRecordNotFound(); return dto(row); },
    async update(id: string, input: unknown) { z.object({ read: z.literal(true) }).strict().parse(input); await notification.detail(id); await db.memberNotification.updateMany({ where: { ownerId, id, readAt: null }, data: { readAt: now() } }); return notification.detail(id); },
    create: unsupported, remove: unsupported,
  };
  const preferences = {
    list: unsupported,
    async detail() { const content = preferenceInputSchema.parse(Object.fromEntries(Object.entries(defaultPreferences).filter(([key]) => key !== 'version'))); const row = await db.memberNotificationPreference.upsert({ where: { ownerId }, create: { ownerId, content }, update: {} }); return preferenceSchema.parse({ ...preferenceInputSchema.parse(row.content), version: row.version }); },
    async update(_id: string, input: unknown) {
      const value = z.object({ version: z.number().int().positive(), content: preferenceInputSchema }).strict().parse(input);
      const previous = await db.memberNotificationPreference.findUnique({ where: { ownerId } });
      if (!previous || previous.version !== value.version) throw new MemberRecordConflict();
      const activationTimes = nextActivationTimes(preferenceInputSchema.parse(previous.content), value.content, previous.activationTimes, previous.updatedAt, now());
      const result = await db.memberNotificationPreference.updateMany({ where: { ownerId, version: value.version }, data: { content: value.content, activationTimes, version: { increment: 1 } } });
      if (!result.count) throw new MemberRecordConflict(); return preferenceSchema.parse({ ...value.content, version: value.version + 1 });
    },
    create: unsupported, remove: unsupported,
  };
  return { notification, preferences };
}
