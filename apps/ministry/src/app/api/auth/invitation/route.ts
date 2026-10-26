import {z} from 'zod';
import {cookies} from 'next/headers';
import {authClient} from '@/lib/auth';
import {authOrigin,authenticatedSession} from '@/lib/auth-security';
import {checkInvitation,accessError} from '@/lib/access-management';
import {operationalOrigin} from '@/lib/operational-config';
import {readInput} from '@/lib/http';
const schema=z.object({action:z.enum(['EMAIL','ACCEPT']),token:z.string().regex(/^[a-f0-9]{64}$/),email:z.email().max(254)}).strict();
export async function POST(request:Request){
 if(!authOrigin(request))return new Response(null,{status:403});
 try{const input=schema.parse(await readInput(request));
  if(input.action==='EMAIL'){
   await checkInvitation(input.token,input.email,null,true);
   // Store only in the initiating browser, HttpOnly, for the PKCE callback. Never grant by URL alone.
   const jar=await cookies();jar.set('ministry-invitation',JSON.stringify({token:input.token,email:input.email}),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600});
   const {error}=await (await authClient(10000)).auth.signInWithOtp({email:input.email,options:{shouldCreateUser:true,emailRedirectTo:`${operationalOrigin()}/auth/callback?flow=invite`}});
   if(error)throw new Error('메일 발송을 완료하지 못했습니다. SMTP 및 허용된 인증 주소를 확인하세요.');
   return Response.json({ok:true,message:'메일의 로그인 링크를 이 브라우저에서 열어 주세요. 메일 확인 후 초대를 수락할 수 있습니다.'});
  }
  const {user}=await authenticatedSession();await checkInvitation(input.token,input.email,user.id,false,true);(await cookies()).delete('ministry-invitation');
  return Response.json({ok:true,next:'/account/security'});
 }catch(e){return accessError(e);}
}
