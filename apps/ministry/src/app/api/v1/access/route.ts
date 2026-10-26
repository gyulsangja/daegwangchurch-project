import {authenticatedSession,authOrigin} from '@/lib/auth-security';
import {changeAccess,listAccess,accessError} from '@/lib/access-management';
import {readInput} from '@/lib/http';
import {operationalOrigin} from '@/lib/operational-config';
import {createClient} from '@supabase/supabase-js';
export async function GET(request:Request){try{if(request.headers.get('host')!==new URL(operationalOrigin()).host)return new Response(null,{status:403});const {user,aal,nextLevel}=await authenticatedSession();if(nextLevel==='aal2'&&aal!=='aal2')throw new Error('MINISTRY_MFA_REQUIRED');return Response.json(await listAccess(user.id,aal),{headers:{'Cache-Control':'no-store'}});}catch(e){return accessError(e);}}
export async function POST(request:Request){if(!authOrigin(request))return new Response(null,{status:403});try{
 const {user,aal,nextLevel}=await authenticatedSession();
 if(nextLevel==='aal2'&&aal!=='aal2')throw new Error('MINISTRY_MFA_REQUIRED');
 const raw=await readInput(request);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('ACCESS_INVALID');
 const {password,...input}=raw as Record<string,unknown>;
 await listAccess(user.id,aal);
 let reauthenticated=false;
 if(aal!=='aal2'){
  if(typeof password!=='string'||!password||password.length>200||!user.email)throw new Error('ACCESS_REAUTH');
  const verifier=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await verifier.auth.signInWithPassword({email:user.email,password});
  if(error||data.user?.id!==user.id)throw new Error('ACCESS_REAUTH');
  reauthenticated=true;
 }
 return Response.json(await changeAccess(user.id,aal,input,reauthenticated),{headers:{'Cache-Control':'no-store'}});
}catch(e){return accessError(e);}}
