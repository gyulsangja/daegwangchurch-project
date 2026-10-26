import {createClient} from '@supabase/supabase-js';
import {validRecoveryIntent} from '@/lib/auth-intent';
import {z} from 'zod';
import {cookies} from 'next/headers';
import {authOrigin,authenticatedSession} from '@/lib/auth-security';
import {readInput} from '@/lib/http';
const input=z.discriminatedUnion('action',[
 z.object({action:z.literal('ENROLL')}).strict(),
 z.object({action:z.literal('VERIFY'),factorId:z.uuid(),code:z.string().regex(/^\d{6}$/)}).strict(),
 z.object({action:z.literal('PASSWORD'),password:z.string().min(12).max(128),currentPassword:z.string().max(200).optional()}).strict(),
]);
export async function POST(request:Request){
 if(!authOrigin(request))return new Response(null,{status:403});
 try{const value=input.parse(await readInput(request));const {client,user,aal}=await authenticatedSession();
  const factors=await client.auth.mfa.listFactors();if(factors.error)throw factors.error;const verified=factors.data.totp.filter(f=>f.status==='verified');
  if(value.action==='ENROLL'){
   if(verified.length&&aal!=='aal2')return Response.json({message:'기존 인증 앱으로 먼저 확인하세요.'},{status:403});
   // Clean only abandoned, unverified enrollment owned by this user.
   for(const f of factors.data.all.filter(f=>f.factor_type==='totp'&&f.status==='unverified'))await client.auth.mfa.unenroll({factorId:f.id});
   const {data,error}=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'대광교회 목회시스템',issuer:'대광교회 목회시스템'});if(error)throw error;
   return Response.json({id:data.id,qr:data.totp.qr_code,secret:data.totp.secret},{headers:{'Cache-Control':'no-store'}});
  }
  if(value.action==='VERIFY'){
   if(!factors.data.all.some(f=>f.id===value.factorId&&f.factor_type==='totp'))throw new Error('factor');
   const {error}=await client.auth.mfa.challengeAndVerify({factorId:value.factorId,code:value.code});if(error)return Response.json({message:'인증 앱의 6자리 코드를 다시 확인하세요.'},{status:400});
   return Response.json({ok:true});
  }
  if(verified.length&&aal!=='aal2')return Response.json({message:'먼저 2단계 인증을 완료하세요.'},{status:403});
  const jar=await cookies();const recovering=validRecoveryIntent(jar.get('ministry-password-recovery')?.value,user.id);
  if(!recovering){
   if(!value.currentPassword||!user.email)return Response.json({message:'현재 비밀번호를 입력하세요. 모르면 비밀번호 찾기를 이용하세요.'},{status:400});
   const verifier=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,{auth:{persistSession:false,autoRefreshToken:false}});const {data,error}=await verifier.auth.signInWithPassword({email:user.email,password:value.currentPassword});if(error||data.user?.id!==user.id)return Response.json({message:'현재 비밀번호를 확인하세요.'},{status:400});
  }
  const {error}=await client.auth.updateUser({password:value.password});if(error)throw error;
  jar.delete('ministry-password-recovery');await client.auth.signOut({scope:'others'});
  return Response.json({ok:true,message:'비밀번호를 변경했습니다. 다른 기기의 갱신 세션도 종료했습니다.'});
 }catch{return Response.json({message:'처리하지 못했습니다. 로그인 상태와 입력값을 확인하세요.'},{status:400});}
}
