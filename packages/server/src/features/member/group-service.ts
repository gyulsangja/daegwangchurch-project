import { z } from 'zod';
import type { PrismaClient } from '@daegwang/database/generated/client';
import { groupPreferenceSchema, groupSnapshotSchema } from '@daegwang/contracts/features/member/groups';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';

type Db = Pick<PrismaClient, 'churchGroup' | 'groupMembership' | 'groupPreference' | 'groupNotice'>;
export function createGroupService(db: Db, verifiedOwner?: string, now = () => new Date()) {
  const ownerId = verifiedOwner ? z.uuid().parse(verifiedOwner) : undefined;
  async function snapshot() {
    const groups = await db.churchGroup.findMany({ where: { isActive: true }, select: { id: true, name: true, description: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] });
    const ids = groups.map(group => group.id);
    const memberships = ownerId ? (await db.groupMembership.findMany({ where: { ownerId, groupId: { in: ids } }, select: { groupId: true } })).map(row => row.groupId) : [];
    const preference = ownerId ? await db.groupPreference.findUnique({ where: { ownerId } }) : null;
    const notices = await db.groupNotice.findMany({ where: { groupId: { in: ids }, group: { isActive: true }, status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: now() }, OR: [{ audience: 'PUBLIC' }, ...(ownerId ? [{ audience: 'MEMBERS', group: { memberships: { some: { ownerId } } } }] : [])] }, select: { id: true, groupId: true, title: true, body: true, audience: true, publishedAt: true }, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: 100 });
    return groupSnapshotSchema.parse({ groups, interests: (preference?.interests ?? []).filter(id => ids.includes(id)), memberships, notifications: preference?.notifications ?? false, version: preference?.version ?? 1, notices: notices.map(row => ({ ...row, publishedAt: row.publishedAt!.toISOString() })) });
  }
  return {
    snapshot,
    async update(input: unknown) {
      if (!ownerId) throw new MemberRecordNotFound();
      const value = groupPreferenceSchema.parse(input);
      const count = await db.churchGroup.count({ where: { id: { in: value.interests }, isActive: true } });
      if (count !== value.interests.length) throw new MemberRecordNotFound();
      await db.groupPreference.upsert({ where: { ownerId }, create: { ownerId }, update: {} });
      const saved = await db.groupPreference.updateMany({ where: { ownerId, version: value.version }, data: { interests: value.interests, notifications: value.notifications, version: { increment: 1 } } });
      if (!saved.count) throw new MemberRecordConflict();
      return snapshot();
    },
  };
}

const groupIdSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);
export const groupNoticeInputSchema = z.object({ groupId: groupIdSchema, title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(20000), audience: z.enum(['PUBLIC', 'MEMBERS']), status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE']) }).strict();
export const groupInputSchema = z.object({ id: groupIdSchema, name: z.string().trim().min(1).max(80), description: z.string().trim().max(1000), isActive: z.boolean(), version: z.number().int().positive().optional() }).strict();

export function createGroupAdminService(db: PrismaClient, adminId: string) {
  async function authorized(tx: Pick<PrismaClient, 'adminProfile' | 'groupManager'>, groupId?: string) {
    const admin = await tx.adminProfile.findFirst({ where: { id: adminId, isActive: true } });
    if (!admin) throw new Error('FORBIDDEN');
    if (admin.role !== 'SUPER_ADMIN' && (!groupId || !await tx.groupManager.findUnique({ where: { groupId_adminId: { groupId, adminId } } }))) throw new Error('FORBIDDEN');
    return admin;
  }
  return {
    async saveGroup(input: unknown) {
      const { version, ...value } = groupInputSchema.parse(input);
      return db.$transaction(async tx => {
        await authorized(tx);
        const existing = await tx.churchGroup.findUnique({ where: { id: value.id } });
        if (existing) {
          if (version === undefined) throw new MemberRecordConflict();
          const changed = await tx.churchGroup.updateMany({ where: { id: value.id, version }, data: { ...value, version: { increment: 1 } } });
          if (!changed.count) throw new MemberRecordConflict();
        } else {
          if (version !== undefined) throw new MemberRecordNotFound();
          await tx.churchGroup.create({ data: value });
        }
        const row = await tx.churchGroup.findUniqueOrThrow({ where: { id: value.id } });
        await tx.activityLog.create({ data: { actorId: adminId, action: 'UPDATE', entityType: 'ChurchGroup', entityId: row.id, summary: '모임 정보 변경' } });
        return row;
      });
    },
    async setMembership(groupId: string, owner: string, approved: boolean) {
      groupIdSchema.parse(groupId); const ownerId = z.uuid().parse(owner);
      return db.$transaction(async tx => {
        await authorized(tx, groupId);
        if (!await tx.churchGroup.findFirst({ where: { id: groupId, isActive: true } }) || !await tx.memberProfile.findUnique({ where: { ownerId } })) throw new MemberRecordNotFound();
        if (approved) await tx.groupMembership.upsert({ where: { groupId_ownerId: { groupId, ownerId } }, create: { groupId, ownerId, approvedBy: adminId }, update: { approvedBy: adminId } });
        else await tx.groupMembership.deleteMany({ where: { groupId, ownerId } });
        await tx.activityLog.create({ data: { actorId: adminId, action: 'UPDATE', entityType: 'GroupMembership', entityId: groupId, summary: approved ? '소속 승인' : '소속 해제', changes: { ownerId } } });
      });
    },
    async saveNotice(input: unknown, id?: string, version?: number) {
      const value = groupNoticeInputSchema.parse(input);
      return db.$transaction(async tx => {
        await authorized(tx, value.groupId);
        if (!await tx.churchGroup.findFirst({ where: { id: value.groupId, isActive: true } })) throw new MemberRecordNotFound();
        let row;
        if (id) {
          z.number().int().positive().parse(version);
          const existing = await tx.groupNotice.findFirst({ where: { id, groupId: value.groupId, deletedAt: null } });
          if (!existing) throw new MemberRecordNotFound();
          const changed = await tx.groupNotice.updateMany({ where: { id, groupId: value.groupId, version }, data: { ...value, publishedAt: value.status === 'PUBLISHED' ? existing.publishedAt ?? new Date() : null, version: { increment: 1 } } });
          if (!changed.count) throw new MemberRecordConflict();
          row = await tx.groupNotice.findUniqueOrThrow({ where: { id } });
        } else row = await tx.groupNotice.create({ data: { ...value, publishedAt: value.status === 'PUBLISHED' ? new Date() : null } });
        await tx.activityLog.create({ data: { actorId: adminId, action: id ? 'UPDATE' : 'CREATE', entityType: 'GroupNotice', entityId: row.id, summary: '모임 공지 저장', changes: { audience: value.audience, status: value.status } } });
        return row;
      });
    },
  };
}
