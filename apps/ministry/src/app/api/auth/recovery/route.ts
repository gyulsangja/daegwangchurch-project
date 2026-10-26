import {z} from 'zod';
import {authClient} from '@/lib/auth';
import {authOrigin} from '@/lib/auth-security';
import {operationalOrigin} from '@/lib/operational-config';
import {readInput} from '@/lib/http';
export async function POST(request:Request){
 if(!authOrigin(request))return new Response(null,{status:403});
 try{const {email}=z.object({email:z.email().max(254)}).strict().parse(await readInput(request));
  // Supabase enforces the provider's email rate limits. Never reveal whether an account exists.
  await (await authClient(10000)).auth.resetPasswordForEmail(email,{redirectTo:`${operationalOrigin()}/auth/callback?flow=recovery`});
  return Response.json({message:'등록된 이메일이라면 비밀번호 재설정 메일이 발송됩니다. 메일이 없으면 잠시 후 확인하거나 관리자에게 문의하세요.'});
 }catch{return Response.json({message:'이메일을 확인하거나 잠시 후 다시 시도하세요.'},{status:400});}
}
