import { Suspense } from 'react';
import { financeSnapshot, financeError } from '@/lib/finance';
import { operationalEnabled } from '@/lib/operational-config';
import Loading from './loading';
import { headers } from 'next/headers';
import { FinanceWorkspace } from '@/components/finance-workspace';
import { financeHost, ministryHost } from '@/lib/church-domains';
export default async function FinancePage() {
  const host=(await headers()).get('host');
  const ministryUrl=host===financeHost?'https://'+ministryHost+'/':'/';
  if(!operationalEnabled())return <FinanceWorkspace ministryUrl={ministryUrl}/>;
  return <Suspense fallback={<Loading/>}><AnnualLedger ministryUrl={ministryUrl}/></Suspense>;
}
async function AnnualLedger({ministryUrl}:{ministryUrl:string}){
  const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Seoul'}).format(new Date()));
  try {
    const data=await financeSnapshot(year);
    return <FinanceWorkspace ministryUrl={ministryUrl} initialData={data}/>;
  }catch (error) {
    const result=await financeError(error).json();
    return <FinanceWorkspace ministryUrl={ministryUrl} initialError={result.message}/>;
  }
}
