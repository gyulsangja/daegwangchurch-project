'use server';
import { revalidatePath } from 'next/cache';
import { getPrisma } from '@daegwang/database/prisma';
import { reviewChurchMembership } from '@daegwang/server/features/member/church-membership';
import { requireSuperAdmin } from '../../../../lib/auth/permissions';
import { createAdminMemberManagement, AdminMemberError } from '@daegwang/server/features/member/admin-management';
import { memberDeletionProvider } from '../../../../lib/member-management';
type State = { ok: boolean; message: string };
function refreshMembers() { revalidatePath('/admin/members'); revalidatePath('/admin/admins'); revalidatePath('/admin/groups'); }
export async function changeMemberRoleAction(_state: State, form: FormData): Promise<State> {
  const admin = await requireSuperAdmin();
  try { await createAdminMemberManagement(getPrisma()).role(admin.id, { ownerId: form.get('ownerId'), role: form.get('role') }); refreshMembers(); return { ok: true, message: '회원의 관리자 권한을 변경했습니다.' }; }
  catch (error) { return { ok: false, message: error instanceof AdminMemberError ? error.message : '권한을 변경하지 못했습니다.' }; }
}
export async function deleteMemberAction(_state: State, form: FormData): Promise<State> {
  const admin = await requireSuperAdmin();
  try { const result = await createAdminMemberManagement(getPrisma(), memberDeletionProvider()).remove(admin.id, { ownerId: form.get('ownerId'), email: form.get('email'), confirm: form.get('confirm') }); refreshMembers(); return { ok: true, message: result.completed ? '회원 계정과 개인 데이터를 삭제했습니다.' : '개인 데이터 삭제와 접근 차단을 완료했습니다. 인증 서버 삭제는 아직 완료되지 않았습니다. 삭제 처리 중 목록에서 다시 시도해 주세요.' }; }
  catch (error) { return { ok: false, message: error instanceof AdminMemberError ? error.message : '삭제하지 못했습니다. 대상과 서버 설정을 확인해 주세요.' }; }
}
export async function saveMemberDetailsAction(_state: State, form: FormData): Promise<State> {
  const admin = await requireSuperAdmin();
  try {
    await createAdminMemberManagement(getPrisma()).churchDetails(admin.id, { ownerId: form.get('ownerId'), version: Number(form.get('version')), position: form.get('position'), groupIds: form.getAll('groupIds') });
    refreshMembers(); return { ok: true, message: '직분과 소속을 저장했습니다. 앱에서 교인 확인 및 소속 화면을 다시 열면 반영됩니다.' };
  } catch (error) { return { ok: false, message: error instanceof AdminMemberError ? error.message : '직분(1~40자)과 소속을 확인한 뒤 다시 시도해 주세요.' }; }
}
export async function reviewMemberAction(_state: { ok: boolean; message: string }, form: FormData) {
  const admin = await requireSuperAdmin();
  if (process.env.APP_CHURCH_MEMBERSHIP_ENABLED !== 'true') return { ok: false, message: '교인 확인 기능을 준비하고 있습니다.' };
  try {
    await reviewChurchMembership(getPrisma(), admin.id, { ownerId: form.get('ownerId'), version: Number(form.get('version')), status: form.get('status'), groupIds: form.get('status') === 'CONFIRMED' ? form.getAll('groupIds') : [] });
    revalidatePath('/admin/members'); revalidatePath('/admin/groups'); return { ok: true, message: '교인 확인과 소속 처리를 저장했습니다.' };
  } catch { return { ok: false, message: '변경된 요청이나 권한을 확인해 주세요. 새로고침 후 다시 시도해 주세요.' }; }
}
