'use server';
import { revalidatePath } from 'next/cache';
import { getPrisma } from '@daegwang/database/prisma';
import { readCareSettings, saveCareSettings } from '@daegwang/server/features/member/care-settings';
import { createCareAdminService } from '@daegwang/server/features/member/care-service';
import { requireAdmin, requireSuperAdmin } from '../../../../lib/auth/permissions';
export async function updateCareAction(_state: { message: string; ok: boolean }, form: FormData) {
  const admin = await requireAdmin(); const policy = (await readCareSettings(getPrisma()))?.policy;
  if (!policy) return { ok: false, message: '담당자와 보관 기준을 먼저 설정해 주세요.' };
  try { await createCareAdminService(getPrisma(), admin.id, policy).update(String(form.get('id')), Number(form.get('version')), String(form.get('status'))); revalidatePath('/admin/care'); return { ok: true, message: '처리 상태를 변경했습니다.' }; }
  catch { return { ok: false, message: '권한 또는 변경된 상태를 확인해 주세요. 완료·취소된 요청은 다시 변경할 수 없습니다.' }; }
}

export async function saveCareSettingsAction(_state: { message: string; ok: boolean }, form: FormData) {
  const admin = await requireSuperAdmin();
  try {
    await saveCareSettings(getPrisma(), admin.id, { enabled: form.get('enabled') === 'on', policy: {
      version: crypto.randomUUID(), retentionDays: form.get('retentionUnit') === 'years' ? Number(form.get('retentionDays')) * 365 : Number(form.get('retentionDays')),
      ...(form.get('retentionUnit') === 'years' ? { retentionYears: Number(form.get('retentionDays')) } : {}),
      notice: String(form.get('notice') ?? '').trim(), adminIds: [...new Set(form.getAll('adminIds').map(String))],
    } }, String(form.get("expectedVersion")??"")||null);
    revalidatePath('/admin/care');
    return { ok: true, message: '접수 설정을 저장했습니다. 앱에서 상담·심방 화면을 다시 열면 반영됩니다.' };
  } catch { return { ok: false, message: '활성 담당자 1명 이상, 보관 기간(1~3650일 또는 1~10년), 동의 안내를 확인해 주세요.' }; }
}
