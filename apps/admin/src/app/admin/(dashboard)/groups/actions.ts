'use server';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getPrisma } from '@daegwang/database/prisma';
import { createGroupAdminService } from '@daegwang/server/features/member/group-service';
import { requireAdmin, requireSuperAdmin } from '../../../../lib/auth/permissions';
export type GroupActionState = { message: string; ok: boolean };
export async function saveGroupAction(_state: GroupActionState, form: FormData): Promise<GroupActionState> {
  const admin = await requireSuperAdmin();
  try { await createGroupAdminService(getPrisma(), admin.id).saveGroup({ id: String(form.get('id') || `group-${randomUUID()}`), name: form.get('name'), description: form.get('description') ?? '', isActive: form.get('isActive') === 'on', version: form.get('version') ? Number(form.get('version')) : undefined }); revalidatePath('/admin/groups'); return { ok: true, message: '모임 정보를 저장했습니다.' }; }
  catch { return { ok: false, message: '모임 이름과 입력 내용을 확인해 주세요.' }; }
}
export async function saveGroupNoticeAction(_state: GroupActionState, form: FormData): Promise<GroupActionState> {
  const admin = await requireAdmin();
  try { await createGroupAdminService(getPrisma(), admin.id).saveNotice({ groupId: form.get('groupId'), title: form.get('title'), body: form.get('body'), audience: form.get('audience'), status: form.get('status') }, String(form.get('id') ?? '') || undefined, form.get('version') ? Number(form.get('version')) : undefined); revalidatePath('/admin/groups'); return { ok: true, message: '모임 공지를 저장했습니다. 푸시는 아직 발송하지 않습니다.' }; }
  catch { return { ok: false, message: '권한·입력 내용 또는 변경된 공지를 확인해 주세요. 새로고침 후 다시 시도할 수 있습니다.' }; }
}
export async function saveMembershipAction(_state: GroupActionState, form: FormData): Promise<GroupActionState> {
  const admin = await requireSuperAdmin();
  try { await createGroupAdminService(getPrisma(), admin.id).setMembership(String(form.get('groupId')), String(form.get('ownerId')), form.get('approved') === 'true'); revalidatePath('/admin/groups'); return { ok: true, message: '소속을 변경했습니다. 관심 모임 선택과는 별개입니다.' }; }
  catch { return { ok: false, message: '등록된 회원과 활성 모임을 선택해 주세요.' }; }
}
export async function saveGroupManagerAction(_state: GroupActionState, form: FormData): Promise<GroupActionState> {
  const admin = await requireSuperAdmin(); const db = getPrisma();
  const groupId = String(form.get('groupId')); const adminId = String(form.get('adminId'));
  try {
    await db.$transaction(async tx => {
      if (!await tx.churchGroup.findUnique({ where: { id: groupId } }) || !await tx.adminProfile.findFirst({ where: { id: adminId, isActive: true } })) throw new Error('Invalid selection');
      if (form.get('assigned') === 'true') await tx.groupManager.upsert({ where: { groupId_adminId: { groupId, adminId } }, create: { groupId, adminId }, update: {} });
      else await tx.groupManager.deleteMany({ where: { groupId, adminId } });
      await tx.activityLog.create({ data: { actorId: admin.id, action: 'UPDATE', entityType: 'GroupManager', entityId: groupId, summary: '모임 담당자 권한 변경', changes: { adminId } } });
    });
    revalidatePath('/admin/groups'); return { ok: true, message: '담당자 권한을 변경했습니다.' };
  } catch { return { ok: false, message: '모임과 활성 관리자를 확인해 주세요.' }; }
}
