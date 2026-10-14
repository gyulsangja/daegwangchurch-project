import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '../../../../../lib/auth/permissions';
export default async function NewAdminPage() { await requireSuperAdmin(); redirect('/admin/members'); }
