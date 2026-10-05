import { requireAdmin } from '../../../../lib/auth/permissions';
import { appReadiness } from '../../../../lib/app-readiness';
import { AppOperations } from '../../../../components/admin/app-operations';
import { operationStatus } from '../../../../lib/operation-status';
export default async function AppOperationsPage() {
  await requireAdmin();
  return <AppOperations channels={appReadiness(process.env)} checks={await operationStatus()} />;
}
