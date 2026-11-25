import { headers } from 'next/headers';
import { FinanceWorkspace } from '@/components/finance-workspace';
import { financeHost, ministryHost } from '@/lib/church-domains';
export default async function FinancePage() {
  const host=(await headers()).get('host');
  return <FinanceWorkspace ministryUrl={host===financeHost?'https://'+ministryHost+'/':'/'}/>;
}
