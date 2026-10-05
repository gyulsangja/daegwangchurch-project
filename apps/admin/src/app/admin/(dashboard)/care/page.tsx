import { getPrisma } from '@daegwang/database/prisma';
import { configuredCarePolicy } from '@daegwang/server/features/member/operations-server';
import { createCareAdminService } from '@daegwang/server/features/member/care-service';
import { careStatusLabels } from '@daegwang/contracts/features/member/extras';
import { requireAdmin } from '../../../../lib/auth/permissions';
import { OperationForm } from '../../../../components/admin/operation-form';
import { updateCareAction } from './actions';
export default async function CarePage() {
  const admin = await requireAdmin(); const policy = configuredCarePolicy();
  if (!policy || !policy.adminIds.includes(admin.id)) return <div className="max-w-3xl space-y-4"><h1 className="text-3xl font-extrabold">상담·심방 접수</h1><p className="rounded-2xl border border-border bg-white p-6">{!policy ? '현재 접수를 받지 않습니다. 열람 담당자, 전달 동의 문구와 보관 기간이 확정되어야 운영을 시작할 수 있습니다.' : '지정된 돌봄 담당자만 요청을 열람할 수 있습니다.'}</p><p>개인 묵상·기도 기록은 이 화면에서 조회하지 않습니다.</p></div>;
  const rows = await createCareAdminService(getPrisma(), admin.id, policy).list();
  return <div className="mx-auto max-w-4xl space-y-6"><h1 className="text-3xl font-extrabold">상담·심방 접수</h1><p>예약은 담당자가 교인과 협의한 후 확정합니다. 보관 기간이 지난 요청은 표시하지 않습니다.</p>{!rows.length && <p className="rounded-2xl bg-white p-6">접수된 요청이 없습니다.</p>}{rows.map(row => <OperationForm key={`${row.id}-${row.version}`} action={updateCareAction} submit="상태 저장"><h2 className="text-xl font-bold">{row.content.kind === 'VISIT' ? '심방' : '상담'} · {row.content.name}</h2><p>{row.content.phone} · {row.content.preferredTime || '시간 협의 필요'}</p><p>{row.content.kind === 'VISIT' ? `${row.content.place} · ${row.content.location}` : row.content.method}</p><p className="whitespace-pre-wrap">{row.content.message || '별도 전달 내용 없음'}</p><input type="hidden" name="id" value={row.id} /><input type="hidden" name="version" value={row.version} /><label className="block">현재 {careStatusLabels[row.status]}<select name="status" defaultValue={row.status}>{Object.entries(careStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></OperationForm>)}</div>;
}
