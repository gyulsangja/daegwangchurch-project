import { redirect, notFound } from 'next/navigation';
import { getAdminProfile } from '@daegwang/server/features/admins/queries';
import { requireSuperAdmin } from '../../../../../../lib/auth/permissions';
export default async function EditAdminPage({ params }: { params: Promise<{id:string}> }) { await requireSuperAdmin(); const row = await getAdminProfile((await params).id); if (!row) notFound(); redirect('/admin/members?q=' + encodeURIComponent(row.email)); }
