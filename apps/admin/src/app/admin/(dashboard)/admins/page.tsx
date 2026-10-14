import { redirect } from 'next/navigation';
import { requireSuperAdmin } from '../../../../lib/auth/permissions';
export default async function AdminsPage() { await requireSuperAdmin(); redirect('/admin/members?status=ADMIN'); }
