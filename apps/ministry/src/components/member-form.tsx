'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MemberInput } from '@daegwang/contracts/ministry';
import type { createDirectory } from '@daegwang/ministry-core/directory';
type Service = ReturnType<typeof createDirectory>;
export function MemberForm({ config, member, returnTo }: { config: ReturnType<Service['config']>; member?: ReturnType<Service['detail']>; returnTo: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const cancel = member ? `/members/${member.id}?returnTo=${encodeURIComponent(returnTo)}` : returnTo;
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return;
    const data = new FormData(event.currentTarget);
    const input: MemberInput = { name: String(data.get('name') ?? ''), status: String(data.get('status')), position: String(data.get('position') ?? ''), phone: String(data.get('phone') ?? ''), address: String(data.get('address') ?? ''), organizationIds: data.getAll('organizationIds').map(String) };
    setPending(true); setError(''); setConflict(false);
    try {
      const response = await fetch(member ? `/api/v1/members/${member.id}` : '/api/v1/members', { method: member ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, ...(member ? { version: member.version } : {}) }) });
      const result = await response.json();
      if (!response.ok) { setConflict(response.status === 409); const fieldErrors = result.errors ? Object.values(result.errors).flat().join(' ') : ''; throw new Error(fieldErrors || result.message); }
      router.push(`/members/${result.id}?saved=1&returnTo=${encodeURIComponent(returnTo)}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 다시 시도해 주세요.'); }
    finally { setPending(false); }
  }
  return <form onSubmit={save} className="member-form"><fieldset disabled={pending}><section className="panel form-section"><h2>기본정보</h2><p>이름과 교적 상태만 필수입니다. 나머지는 나중에 입력할 수 있습니다.</p><div className="form-grid"><label>이름 <span className="required">필수</span><input autoComplete="off" name="name" required maxLength={60} defaultValue={member?.name} placeholder="가상 이름을 입력하세요" /></label><label>교적 상태 <span className="required">필수</span><select name="status" required defaultValue={member?.status ?? config.statuses[0]?.code}>{config.statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}</select></label><label>직분<select name="position" defaultValue={member?.position ?? ''}><option value="">미지정</option>{config.positions.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}</select></label><label>연락처<input type="tel" name="phone" autoComplete="off" maxLength={25} defaultValue={member?.privateProfile?.phone ?? ''} placeholder="개발 검토 중에는 비워 두세요" /></label><label className="full">주소<input name="address" autoComplete="off" maxLength={240} defaultValue={member?.privateProfile?.address ?? ''} placeholder="개발 검토 중에는 비워 두세요" /></label></div></section><section className="panel form-section"><h2>소속</h2><p>둘 이상의 소속을 선택할 수 있습니다. 아래 조직은 검토용 예시입니다.</p><div className="organization-options">{config.organizations.map(o => <label key={o.id}><input type="checkbox" name="organizationIds" value={o.id} defaultChecked={member?.organizationIds.includes(o.id)} /><span>{o.name}</span></label>)}</div></section></fieldset>{error && <div className="feedback error" role="alert">{error}{conflict && <button type="button" className="button" onClick={() => window.location.reload()}>최신 정보로 새로고침</button>}</div>}<div className="form-actions"><span className="muted">개발용 임시 저장 · 실제 명부에 반영되지 않습니다.</span><Link href={cancel} className="button">취소</Link><button type="submit" disabled={pending} className="button primary">{pending ? '저장 중…' : member ? '변경 저장' : '교인 등록'}</button></div></form>;
}
