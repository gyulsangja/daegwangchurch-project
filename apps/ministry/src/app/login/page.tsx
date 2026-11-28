import {headers} from 'next/headers';
import {financeTab,financeHref} from '@/lib/finance-routes';
import {financeHost} from '@/lib/church-domains';
import {LoginForm} from '@/components/login-form';

export async function generateMetadata(){
  const finance=(await headers()).get('host')===financeHost;
  return {title:{absolute:finance?'재정 관리 로그인 · 대광교회':'통합 관리 로그인 · 대광교회'}};
}
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){
  const [h,params]=await Promise.all([headers(),searchParams]);
  const custom=h.get('host')===financeHost;
  const tab=typeof params.next==='string'&&(custom||params.next.startsWith('/finance'))?financeTab(params.next):undefined;
  return <LoginForm finance={custom||!!tab} destination={financeHref(tab??'overview',custom)}/>;
}
