import Link from 'next/link';
import { workspace } from '@/lib/workspace';
import { MemberForm } from '@/components/member-form';
export default async function NewMember() {
  const { config } = await workspace();
  return <><Link href="/members" className="back-link">← 교인 목록</Link><div className="page-heading"><div><p className="eyebrow">교적 관리</p><h1>교인 등록</h1><p>앱 가입 계정 없이도 교인을 등록할 수 있습니다.</p></div></div><MemberForm config={config} returnTo="/members" /></>;
}
