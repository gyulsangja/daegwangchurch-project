import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { allowAdminPreview, appReadiness } from '../../../lib/app-readiness';
import { AppOperations } from '../../../components/admin/app-operations';
import { PublicationRehearsal } from '../../../components/admin/publication-rehearsal';
import { GroupNoticeRehearsal } from '../../../components/admin/group-notice-rehearsal';
export default async function PreviewOperations() {
  if (!allowAdminPreview(process.env.NODE_ENV, process.env.ADMIN_DEMO_MODE, (await headers()).get('host'))) notFound();
  return <main className="min-h-screen bg-background-muted px-4 py-8 sm:px-8"><div role="note" className="mx-auto mb-6 max-w-6xl rounded-xl bg-primary-50 p-4 font-bold text-primary-700">관리자 개발 체험 · 가상 자료만 표시 · 실제 저장·발행 없음</div><AppOperations channels={appReadiness({})} preview /><PublicationRehearsal /><GroupNoticeRehearsal /></main>;
}
