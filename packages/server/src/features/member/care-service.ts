import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { careCreateSchema, careSchema, careStatusSchema } from '@daegwang/contracts/features/member/extras';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';

export const carePolicySchema = z.object({ version: z.string().min(1).max(100), notice: z.string().min(1).max(10000), retentionDays: z.number().int().min(1).max(3650), adminIds: z.array(z.string().min(1)).min(1).max(20) }).strict();
export type CarePolicy = z.infer<typeof carePolicySchema>;
type Db = Pick<PrismaClient, 'memberCareRequest'>;
const dto = (row: { id: string; content: unknown; status: string; version: number; createdAt: Date; updatedAt: Date }) => careSchema.parse({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
export function createCareService(db: Db, identity: string, approvedPolicy: CarePolicy, now = () => new Date()) {
  const ownerId = z.uuid().parse(identity); const policy = carePolicySchema.parse(approvedPolicy);
  const owned = (id?: string) => ({ ownerId, id, expiresAt: { gt: now() } });
  return {
    async list(input: unknown) { const { page } = z.object({ page: z.coerce.number().int().min(0).max(10000).default(0) }).strict().parse(input); const rows = await db.memberCareRequest.findMany({ where: owned(), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: page * 20, take: 21 }); return { data: rows.slice(0, 20).map(dto), nextPage: rows.length > 20 ? page + 1 : null }; },
    async detail(id: string) { const row = await db.memberCareRequest.findFirst({ where: owned(id) }); if (!row) throw new MemberRecordNotFound(); return dto(row); },
    async create(input: unknown) {
      const value = careCreateSchema.parse(input);
      if (value.policyVersion !== policy.version) throw new MemberRecordConflict();
      const row = await db.memberCareRequest.upsert({ where: { ownerId_requestKey: { ownerId, requestKey: value.requestKey } }, create: { ownerId, requestKey: value.requestKey, content: value.content, policyVersion: policy.version, consentedAt: now(), expiresAt: new Date(now().getTime() + policy.retentionDays * 86400000) }, update: {} });
      if (row.expiresAt <= now()) throw new MemberRecordNotFound();
      // A retry key cannot be used to silently submit different sensitive contents.
      if (JSON.stringify(row.content) !== JSON.stringify(value.content)) {
        const previous = careCreateSchema.shape.content.parse(row.content);
        if (JSON.stringify(previous) !== JSON.stringify(value.content)) throw new MemberRecordConflict();
      }
      return dto(row);
    },
    async update(id: string, input: unknown) {
      const value = z.object({ version: z.number().int().positive(), action: z.literal('CANCEL') }).strict().parse(input);
      const row = await db.memberCareRequest.findFirst({ where: owned(id) }); if (!row) throw new MemberRecordNotFound();
      const changed = await db.memberCareRequest.updateMany({ where: { ...owned(id), version: value.version, status: { in: ['RECEIVED', 'DISCUSSING', 'SCHEDULED'] } }, data: { status: 'CANCELLED', version: { increment: 1 } } });
      if (!changed.count) throw new MemberRecordConflict();
      return dto(await db.memberCareRequest.findFirstOrThrow({ where: owned(id) }));
    },
    async remove() { throw new MemberRecordConflict(); },
  };
}

export function createCareAdminService(db: PrismaClient, adminId: string, approvedPolicy: CarePolicy, now = () => new Date()) {
  const policy = carePolicySchema.parse(approvedPolicy);
  async function authorize() {
    if (!policy.adminIds.includes(adminId) || !await db.adminProfile.findFirst({ where: { id: adminId, isActive: true } })) throw new Error('FORBIDDEN');
  }
  return {
    async list() { await authorize(); return (await db.memberCareRequest.findMany({ where: { expiresAt: { gt: now() } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100 })).map(dto); },
    async update(id: string, version: number, next: string) {
      await authorize(); z.number().int().positive().parse(version); const status = careStatusSchema.parse(next);
      const allowed: Record<string, string[]> = { RECEIVED: ['DISCUSSING', 'CANCELLED'], DISCUSSING: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], SCHEDULED: ['DISCUSSING', 'COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
      return db.$transaction(async tx => {
        const row = await tx.memberCareRequest.findFirst({ where: { id, expiresAt: { gt: now() } } });
        if (!row) throw new MemberRecordNotFound();
        if (!allowed[row.status]?.includes(status)) throw new MemberRecordConflict();
        const changed = await tx.memberCareRequest.updateMany({ where: { id, version, status: row.status, expiresAt: { gt: now() } }, data: { status, version: { increment: 1 } } });
        if (!changed.count) throw new MemberRecordConflict();
        await tx.activityLog.create({ data: { actorId: adminId, action: 'UPDATE', entityType: 'MemberCareRequest', entityId: id, summary: '돌봄 요청 상태 변경', changes: { previous: row.status, next: status } } });
      });
    },
    async purgeExpired() { await authorize(); return db.memberCareRequest.deleteMany({ where: { expiresAt: { lte: now() } } }); },
  };
}
