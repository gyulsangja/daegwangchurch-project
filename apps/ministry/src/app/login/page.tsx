import {headers} from 'next/headers';
import {financeHost} from '@/lib/church-domains';
import {LoginForm} from '@/components/login-form';

export async function generateMetadata(){
  const finance=(await headers()).get('host')===financeHost;
  return {title:{absolute:finance?'재정 관리 로그인 · 대광교회':'통합 관리 로그인 · 대광교회'}};
}
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){
  const [h,params]=await Promise.all([headers(),searchParams]);
  return <LoginForm finance={h.get('host')===financeHost||params.next==='/finance'}/>;
}
