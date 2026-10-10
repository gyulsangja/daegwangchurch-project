import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { allowAdminPreview } from '../../../lib/app-readiness';
import AdminPagesPage from '../../admin/(dashboard)/pages/page';

// Exercise the real, static navigation page without exposing any admin data.
export default async function PreviewChurchGuide() {
  if (!allowAdminPreview(process.env.NODE_ENV, process.env.ADMIN_DEMO_MODE, (await headers()).get('host'))) notFound();
  return <main className="p-4 sm:p-8"><AdminPagesPage /></main>;
}
