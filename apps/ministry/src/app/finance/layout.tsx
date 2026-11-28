import {headers} from 'next/headers';
import {financeHref,financeTab} from '@/lib/finance-routes';
import {financeHost} from '@/lib/church-domains';
import { redirect } from 'next/navigation';
import { financeSession } from '@/lib/finance';
import { operationalEnabled } from '@/lib/operational-config';
import '@/components/finance.css';

export const metadata = { title: { absolute: '재정 관리 · 대광교회' } };

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  if (operationalEnabled()) {
    try {
      await financeSession();
    } catch (error) {
      if (error instanceof Error && error.message === 'MINISTRY_LOGIN_REQUIRED') {
        const h=await headers();
        const next=financeHref(financeTab(h.get('x-ministry-path')??'')??'overview',h.get('host')===financeHost);
        redirect('/login?next='+encodeURIComponent(next));
      }
      if (error instanceof Error && error.message === 'MINISTRY_MFA_REQUIRED') redirect('/account/security');
      throw error;
    }
  }
  return <>
    <a className="skip-link" href="#finance-main">재정 본문 바로가기</a>
    <main id="finance-main" className="finance-shell">{children}</main>
  </>;
}
