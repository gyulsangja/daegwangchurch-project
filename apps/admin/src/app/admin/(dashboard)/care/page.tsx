import { AdminDialog } from '../../../../components/admin/admin-dialog';
import Link from 'next/link';
import { getPrisma } from '@daegwang/database/prisma';
import { readCareSettings } from '@daegwang/server/features/member/care-settings';
import { createCareAdminService, careRetentionLabel } from '@daegwang/server/features/member/care-service';
import { careStatusLabels } from '@daegwang/contracts/features/member/extras';
import { requireAdmin } from '../../../../lib/auth/permissions';
import { OperationForm } from '../../../../components/admin/operation-form';
import { updateCareAction, saveCareSettingsAction } from './actions';
const transitions: Record<string, string[]> = { RECEIVED: ['DISCUSSING', 'CANCELLED'], DISCUSSING: ['SCHEDULED', 'COMPLETED', 'CANCELLED'], SCHEDULED: ['DISCUSSING', 'COMPLETED', 'CANCELLED'], COMPLETED: [], CANCELLED: [] };
export default async function CarePage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const admin = await requireAdmin(); const db = getPrisma(); const settings = await readCareSettings(db);
  const stored=await db.careSetting.findUnique({where:{id:"CARE"},select:{policy:true}});
  const storedVersion=stored&&(stored.policy as {version?:string})?.version||"";
  const superAdmin = admin.role === 'SUPER_ADMIN'; const authorized = settings?.policy.adminIds.includes(admin.id);
  const admins = superAdmin ? await db.adminProfile.findMany({ where: { isActive: true }, select: { id: true, displayName: true }, orderBy: { displayName: 'asc' } }) : [];
  const rows = settings && authorized ? await createCareAdminService(db, admin.id, settings.policy).list() : [];
  const { status = 'OPEN', q = '' } = await searchParams;
  const filtered = rows.filter(row => (status === 'ALL' || (status === 'OPEN' ? transitions[row.status].length > 0 : row.status === status)) && `${row.content.name} ${row.content.phone}`.includes(q.trim()));
  return <div className="mx-auto max-w-4xl space-y-6">
    <header><h1 className="text-3xl font-extrabold">상담·심방</h1><p className="mt-2 text-text-secondary">앱에서 받은 요청을 담당자가 확인하고 연락해 일정을 정합니다.</p></header>
    <p role="status" className="rounded-xl border border-border bg-white p-4"><strong>{settings?.enabled ? '앱 접수 중' : '새 요청 접수 중지'}</strong> · {settings ? `접수일로부터 ${careRetentionLabel(settings.policy)} 보관` : '담당자와 접수 설정을 저장해 주세요.'}</p>
    {superAdmin && <AdminDialog  title={<>접수 설정 · 담당자와 보관 기간</>} trigger={<>접수 설정 · 담당자와 보관 기간</>}>
      <OperationForm key={settings?.policy.version ?? 'new'} action={saveCareSettingsAction} submit="접수 설정 저장">
        <input type="hidden" name="expectedVersion" value={storedVersion}/>
        <label className="flex items-center gap-3"><input type="checkbox" name="enabled" defaultChecked={settings?.enabled ?? false} className="!w-5" />앱에서 새 상담·심방 요청 받기</label>
        <fieldset><legend className="mb-2 font-bold">요청을 열람하고 처리할 담당자</legend><p className="mb-2 text-sm text-text-secondary">최고관리자도 담당자로 지정해야 요청 내용을 볼 수 있습니다.</p>{admins.map(person => <label key={person.id} className="flex min-h-11 items-center gap-3"><input type="checkbox" name="adminIds" value={person.id} defaultChecked={settings?.policy.adminIds.includes(person.id)} className="!w-5" />{person.displayName}</label>)}</fieldset>
        <label className="block">접수일로부터 보관할 기간<input type="number" name="retentionDays" required min={1} max={3650} defaultValue={settings?.policy.retentionYears ?? settings?.policy.retentionDays ?? 5} /></label>
        <label className="block">기간 단위<select name="retentionUnit" defaultValue={!settings || settings.policy.retentionYears ? 'years' : 'days'}><option value="years">년 · 윤년을 포함한 달력 기준 (최대 10년)</option><option value="days">일 (최대 3650일)</option></select></label>
        <label className="block">앱에 표시할 개인정보 전달 동의 안내<textarea name="notice" rows={5} required maxLength={10000} defaultValue={settings?.policy.notice ?? '상담·심방을 위해 이름, 연락처, 희망 시간과 요청 내용을 지정된 교회 담당자에게 전달합니다.'} /></label>
        <p className="text-sm text-text-secondary">보관 기간은 앱 동의 안내에 자동으로 함께 표시됩니다. 기간 변경은 새 요청부터 적용하며 기존 요청의 만료일은 유지됩니다. 접수를 중지해도 기존 요청은 처리할 수 있습니다. 개인 묵상·기도 기록은 열람하지 않습니다.</p>
      </OperationForm>
    </AdminDialog>}
    {!authorized ? <p className="rounded-xl bg-white p-5">{settings ? '지정된 담당자만 요청 내용을 볼 수 있습니다.' : '최고관리자가 위 접수 설정을 저장하면 사용할 수 있습니다.'}</p> : <>
      <form className="flex flex-wrap gap-3 rounded-xl bg-white p-4"><label className="flex-1">이름·연락처 검색<input name="q" defaultValue={q} className="mt-1 min-h-11 w-full rounded-lg border border-border px-3" /></label><label>처리 상태<select name="status" defaultValue={status} className="mt-1 block min-h-11 rounded-lg border border-border px-3"><option value="OPEN">처리할 요청</option><option value="ALL">전체</option>{Object.entries(careStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="focus-ring min-h-11 self-end rounded-lg bg-primary-700 px-5 text-white">조회</button><Link className="self-end p-3 text-sm" href="/admin/care">초기화</Link></form>
      <p className="text-sm text-text-secondary">최근 접수 100건 중 {filtered.length}건 · 만료된 요청은 표시하지 않습니다.</p>
      {!filtered.length && <p className="rounded-xl bg-white p-6">조회 조건에 맞는 요청이 없습니다.</p>}
      {filtered.map(row => <AdminDialog key={row.id} title={<>{row.content.kind === 'VISIT' ? '심방' : '상담'} · {row.content.name}<span className="ml-3 text-sm font-normal text-primary-700">{careStatusLabels[row.status]}</span></>} trigger={<>{row.content.kind === 'VISIT' ? '심방' : '상담'} · {row.content.name}<span className="ml-3 text-sm font-normal text-primary-700">{careStatusLabels[row.status]}</span></>}><div className="space-y-3 py-3"><p>{row.content.phone} · {row.content.preferredTime || '시간 협의 필요'}</p><p>{row.content.kind === 'VISIT' ? `${row.content.place} · ${row.content.location}` : row.content.method}</p><p className="whitespace-pre-wrap">{row.content.message || '별도 전달 내용 없음'}</p>
        {!!transitions[row.status].length && <OperationForm action={updateCareAction} submit="처리 상태 저장"><input type="hidden" name="id" value={row.id} /><input type="hidden" name="version" value={row.version} /><label className="block">다음 처리 상태<select name="status" required defaultValue=""><option value="" disabled>선택해 주세요</option>{transitions[row.status].map(value => <option key={value} value={value}>{careStatusLabels[value as keyof typeof careStatusLabels]}</option>)}</select></label></OperationForm>}
      </div></AdminDialog>)}
    </>}
  </div>;
}
