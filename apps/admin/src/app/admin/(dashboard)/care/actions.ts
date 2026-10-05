'use server';
import { revalidatePath } from 'next/cache';
import { getPrisma } from '@daegwang/database/prisma';
import { configuredCarePolicy } from '@daegwang/server/features/member/operations-server';
import { createCareAdminService } from '@daegwang/server/features/member/care-service';
import { requireAdmin } from '../../../../lib/auth/permissions';
export async function updateCareAction(_state: { message: string; ok: boolean }, form: FormData) {
  const admin = await requireAdmin(); const policy = configuredCarePolicy();
  if (!policy) return { ok: false, message: '담당자와 보관 기준을 먼저 설정해 주세요.' };
  try { await createCareAdminService(getPrisma(), admin.id, policy).update(String(form.get('id')), Number(form.get('version')), String(form.get('status'))); revalidatePath('/admin/care'); return { ok: true, message: '처리 상태를 변경했습니다.' }; }
  catch { return { ok: false, message: '권한 또는 변경된 상태를 확인해 주세요. 완료·취소된 요청은 다시 변경할 수 없습니다.' }; }
}
