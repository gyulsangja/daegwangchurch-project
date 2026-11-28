import {notFound} from 'next/navigation';
import {financeTab,type FinanceTab} from '@/lib/finance-routes';
import { Suspense } from 'react';
import { financeSnapshot, financeError } from '@/lib/finance';
import { operationalEnabled } from '@/lib/operational-config';
import Loading from './loading';
import { headers } from 'next/headers';
import { FinanceWorkspace } from '@/components/finance-workspace';
import { financeHost, ministryHost } from '@/lib/church-domains';
export default async function FinancePage() {
  const h=await headers();const host=h.get('host');
  const initialTab=financeTab(h.get('x-ministry-path')??'/finance');
  if(!initialTab)notFound();
  const route={initialTab,customHost:host===financeHost};
  const ministryUrl=host===financeHost?'https://'+ministryHost+'/':'/';
  if(!operationalEnabled())return <FinanceWorkspace ministryUrl={ministryUrl} {...route}/>;
  return <Suspense fallback={<Loading/>}><AnnualLedger ministryUrl={ministryUrl} {...route}/></Suspense>;
}
async function AnnualLedger({ministryUrl,...route}:{ministryUrl:string;initialTab:FinanceTab;customHost:boolean}){
  const year=Number(new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Seoul'}).format(new Date()));
  try {
    const data=await financeSnapshot(year);
    return <FinanceWorkspace ministryUrl={ministryUrl} {...route} initialData={data}/>;
  }catch (error) {
    const result=await financeError(error).json();
    return <FinanceWorkspace ministryUrl={ministryUrl} {...route} initialError={result.message}/>;
  }
}
