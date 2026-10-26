import {recoveryIntent} from '@/lib/auth-intent';
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {authClient} from '@/lib/auth';
import {operationalOrigin} from '@/lib/operational-config';
export async function GET(request:Request){
 const origin=operationalOrigin();const url=new URL(request.url);
 if(request.headers.get('host')!==new URL(origin).host)return new Response(null,{status:403});
 const code=url.searchParams.get('code');const flow=url.searchParams.get('flow');
 if(!code||!['invite','recovery'].includes(flow??''))return NextResponse.redirect(`${origin}/login?authError=1`);
 try{const client=await authClient(10000);const {data,error}=await client.auth.exchangeCodeForSession(code);if(error||!data.user)throw error;
  if(flow==='recovery'){
   (await cookies()).set('ministry-password-recovery',recoveryIntent(data.user.id),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:600});
   return NextResponse.redirect(`${origin}/account/security?password=1`);
  }
  return NextResponse.redirect(`${origin}/invite?confirmed=1`);
 }catch{return NextResponse.redirect(`${origin}/login?authError=1`);}
}
