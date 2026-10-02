import { AdminShell } from "../../../components/admin/admin-shell";
import { requireAdmin } from "../../../lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminShell
      admin={{ displayName: admin.displayName, email: admin.email, role: admin.role }}
    >
      {children}
    </AdminShell>
  );
}
