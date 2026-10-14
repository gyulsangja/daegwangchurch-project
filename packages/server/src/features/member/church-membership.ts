import type { PrismaClient, Prisma } from '@daegwang/database/generated/client';
import { churchMembershipSchema, churchRequestSchema, churchReviewSchema, churchDetailsSchema } from '@daegwang/contracts/features/member/church-membership';
import { MemberRecordConflict } from './record-service';

// Called inside signup's transaction, after the account identity is verified.
export async function requestChurchOnSignup(tx: Prisma.TransactionClient, ownerId: string, input: unknown) {
  const details = churchDetailsSchema.parse(input);
  await tx.churchMembership.upsert({ where: { ownerId }, create: { ownerId, ...details, status: 'PENDING', requestedAt: new Date() }, update: {} });
}

export function createChurchMembershipService(db: PrismaClient, ownerId: string) {
  async function detail() {
    const row = await db.churchMembership.findUnique({ where: { ownerId } });
    const memberships = await db.groupMembership.findMany({ where: { ownerId, group: { isActive: true } }, select: { group: { select: { id: true, name: true } } } });
    return churchMembershipSchema.parse({ ...(row ?? { status: 'UNCONFIRMED', realName: '', phone: '', position: '', version: 0 }), groups: memberships.map(item => item.group) });
  }
  return { detail, async request(input: unknown) {
    const value = churchRequestSchema.parse(input);
    await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ownerId}::text, 0))`;
      if (await tx.memberDeletion.findUnique({ where: { ownerId } })) throw new MemberRecordConflict();
      const old = await tx.churchMembership.findUnique({ where: { ownerId } });
      if ((old?.version ?? 0) !== value.version || old?.status === 'CONFIRMED' || old?.status === 'PENDING') throw new MemberRecordConflict();
      await tx.memberProfile.upsert({ where: { ownerId }, create: { ownerId }, update: {} });
      const details = { realName: value.realName, phone: value.phone, position: value.position };
      await tx.churchMembership.upsert({ where: { ownerId }, create: { ownerId, ...details, status: 'PENDING', requestedAt: new Date() }, update: { ...details, status: 'PENDING', requestedAt: new Date(), reviewedAt: null, reviewedBy: null, version: { increment: 1 } } });
    });
    return detail();
  } };
}

export async function reviewChurchMembership(db: PrismaClient, adminId: string, input: unknown) {
  const value = churchReviewSchema.parse(input);
  await db.$transaction(async tx => {
    const admin = await tx.adminProfile.findFirst({ where: { id: adminId, isActive: true, role: 'SUPER_ADMIN' } });
    if (!admin) throw new Error('Forbidden');
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${value.ownerId}::text, 0))`;
    if (await tx.memberDeletion.findUnique({ where: { ownerId: value.ownerId } })) throw new MemberRecordConflict();
    if (await tx.churchGroup.count({ where: { id: { in: value.groupIds }, isActive: true } }) !== value.groupIds.length) throw new MemberRecordConflict();
    const member = await tx.churchMembership.findUnique({ where: { ownerId: value.ownerId } });
    if (value.status === 'CONFIRMED' && !churchDetailsSchema.safeParse(member && { realName: member.realName, phone: member.phone, position: member.position }).success) throw new MemberRecordConflict();
    const updated = await tx.churchMembership.updateMany({ where: { ownerId: value.ownerId, version: value.version, status: value.status === 'CONFIRMED' ? 'PENDING' : { in: ['PENDING', 'CONFIRMED'] } }, data: { status: value.status, reviewedAt: new Date(), reviewedBy: adminId, version: { increment: 1 } } });
    if (!updated.count) throw new MemberRecordConflict();
    if (value.status === 'CONFIRMED') {
      for (const groupId of value.groupIds) await tx.groupMembership.upsert({ where: { groupId_ownerId: { groupId, ownerId: value.ownerId } }, create: { groupId, ownerId: value.ownerId, approvedBy: adminId }, update: {} });
    } else {
      await tx.groupMembership.deleteMany({ where: { ownerId: value.ownerId } });
    }
    await tx.activityLog.create({ data: { actorId: adminId, action: 'UPDATE', entityType: 'ChurchMembership', entityId: value.ownerId, summary: '교인 확인 및 소속 처리', changes: { status: value.status, groupIds: value.groupIds } } });
  });
}
