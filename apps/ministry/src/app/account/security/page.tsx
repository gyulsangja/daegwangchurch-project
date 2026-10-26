import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {authenticatedSession} from '@/lib/auth-security';
import {validRecoveryIntent} from '@/lib/auth-intent';
import {SecurityForm} from '@/components/auth-forms';
export default async function Page(){const session=await authenticatedSession().catch(()=>null);if(!session)redirect('/login');const {data,error}=await session.client.auth.mfa.listFactors();if(error)return <main className="locked"><h1>로그인 및 보안</h1><p>인증 설정을 불러오지 못했습니다. 새로고침 후 다시 시도하세요.</p></main>;return <SecurityForm email={session.user.email??''} aal={session.aal} recovery={validRecoveryIntent((await cookies()).get('ministry-password-recovery')?.value,session.user.id)} factors={data.totp.filter(f=>f.status==='verified').map(f=>({id:f.id,name:f.friendly_name??'인증 앱'}))}/>;}
