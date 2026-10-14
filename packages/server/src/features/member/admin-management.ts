import { z } from 'zod';
import type { PrismaClient, Prisma } from '@daegwang/database/generated/client';
import type { DeletionProvider } from './deletion-service';
export class AdminMemberError extends Error {}
export function createAdminMemberManagement(db: PrismaClient, provider?: Pick<DeletionProvider, 'deleteIdentity'>) {
  async function actor(tx: Prisma.TransactionClient, actorId: string) {
    const user = await tx.adminProfile.findFirst({ where: { id: actorId, role: 'SUPER_ADMIN', isActive: true } });
    if (!user) throw new AdminMemberError('최고관리자 권한을 확인해 주세요.'); return user;
  }
  return {
    async role(actorId: string, input: unknown) {
      const value = z.object({ ownerId: z.uuid(), role: z.enum(['MEMBER','ADMIN','SUPER_ADMIN']) }).parse(input);
      await db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-member-management', 0))`;
        const admin = await actor(tx, actorId); if (admin.authUserId === value.ownerId) throw new AdminMemberError('현재 로그인한 최고관리자 자신의 권한은 변경할 수 없습니다.');
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${value.ownerId}::text, 0))`;
        if (await tx.memberDeletion.findUnique({ where: { ownerId: value.ownerId } })) throw new AdminMemberError('삭제 처리 중인 회원입니다.');
        const users = await tx.$queryRaw<{ email: string }[]>`SELECT email FROM auth.users WHERE id=${value.ownerId}::uuid AND deleted_at IS NULL AND COALESCE(is_anonymous,false)=false`;
        if (!users[0]?.email) throw new AdminMemberError('회원 계정을 찾을 수 없습니다.');
        const profile = await tx.memberProfile.findUnique({ where: { ownerId: value.ownerId } });
        const existing = await tx.adminProfile.findUnique({ where: { authUserId: value.ownerId } });
        if (value.role === 'MEMBER') {
          if (existing) { await tx.adminProfile.update({ where: { id: existing.id }, data: { isActive: false } }); await tx.groupManager.deleteMany({ where: { adminId: existing.id } }); }
        } else await tx.adminProfile.upsert({ where: { authUserId: value.ownerId }, create: { authUserId: value.ownerId, email: users[0].email, displayName: profile?.displayName || users[0].email, role: value.role }, update: { role: value.role, isActive: true } });
        await tx.activityLog.create({ data: { actorId, action: 'UPDATE', entityType: 'AdminProfile', entityId: value.ownerId, summary: value.role === 'MEMBER' ? '회원 관리에서 관리자 권한 해제' : '회원 관리에서 관리자 권한 지정', changes: { role: value.role } } });
      });
    },
    async remove(actorId: string, input: unknown) {
      if (!provider) throw new AdminMemberError('서버 전용 Supabase 키를 먼저 설정해 주세요.');
      const value = z.object({ ownerId: z.uuid(), email: z.email(), confirm: z.literal('DELETE') }).parse(input);
      await db.$transaction(async tx => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin-member-management', 0))`;
        const admin = await actor(tx, actorId); if (admin.authUserId === value.ownerId) throw new AdminMemberError('현재 로그인한 계정은 삭제할 수 없습니다.');
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${value.ownerId}::text, 0))`;
        const users = await tx.$queryRaw<{ email: string }[]>`SELECT email FROM auth.users WHERE id=${value.ownerId}::uuid AND deleted_at IS NULL`;
        if (!users[0] || users[0].email.toLowerCase() !== value.email.trim().toLowerCase()) throw new AdminMemberError('삭제 확인 이메일이 일치하지 않습니다.');
        const oldAdmin = await tx.adminProfile.findUnique({ where: { authUserId: value.ownerId } });
        if (oldAdmin?.isActive) throw new AdminMemberError('먼저 관리자 권한을 해제해 주세요.');
        if (await tx.memberDeletion.findUnique({ where: { ownerId: value.ownerId } })) return;
        // Retain attributable administrative audit history, not former contact details.
        if (oldAdmin) { await tx.adminProfile.update({ where: { id: oldAdmin.id }, data: { displayName: '삭제된 관리자', email: `deleted-${value.ownerId}@example.invalid` } }); await tx.groupManager.deleteMany({ where: { adminId: oldAdmin.id } }); }
        await tx.memberDeletion.create({ data: { ownerId: value.ownerId, policyVersion: 'admin-delete-20261015', policySnapshot: { initiatedByAdmin: true, scope: 'ALL_MEMBER_DATA' }, receiptRetentionDays: 90 } });
        await tx.memberRecord.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberBookmark.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberSchedule.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberPushDevice.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberNotification.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberNotificationPreference.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberCareRequest.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.groupMembership.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.groupPreference.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.pendingRegistration.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.memberProfile.deleteMany({ where: { ownerId: value.ownerId } });
        await tx.activityLog.create({ data: { actorId, action: 'DELETE', entityType: 'MemberAccount', entityId: value.ownerId, summary: '관리자 회원 계정 삭제 요청 · 개인 기록 내용 미열람' } });
      });
      try { await provider.deleteIdentity(value.ownerId); await db.memberDeletion.update({ where: { ownerId: value.ownerId }, data: { status: 'COMPLETED', completedAt: new Date() } }); return { completed: true }; }
      catch { return { completed: false }; }
    },
  };
}
