import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { allowAdminPreview } from '../../../lib/app-readiness';
import { ContentHome } from '../../../components/admin/content-home';
import { AdminShell } from '../../../components/admin/admin-shell';
import { PublicationRehearsal } from '../../../components/admin/publication-rehearsal';
import { GroupNoticeRehearsal } from '../../../components/admin/group-notice-rehearsal';
export default async function PreviewOperations() {
  if (!allowAdminPreview(process.env.NODE_ENV, process.env.ADMIN_DEMO_MODE, (await headers()).get('host'))) notFound();
  return <AdminShell admin={{ displayName: '개발 체험', email: '', role: 'ADMIN' }}><div className="mx-auto max-w-5xl"><div role="note" className="mb-6 rounded-xl bg-primary-50 p-4 font-bold text-primary-700">관리자 개발 체험 · 가상 자료만 표시 · 실제 저장·발행 없음</div><ContentHome preview /><PublicationRehearsal /><GroupNoticeRehearsal /></div></AdminShell>;
}
