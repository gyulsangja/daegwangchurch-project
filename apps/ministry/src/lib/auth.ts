import 'server-only';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
export async function authClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('MINISTRY_AUTH_NOT_CONFIGURED');
 const jar=await cookies();return createServerClient(url,key,{cookieOptions:{name:'ministry-auth',httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'},cookies:{getAll:()=>jar.getAll(),setAll(values){try{for(const {name,value,options} of values)jar.set(name,value,options);}catch{/* proxy refreshes server component cookies */}}}});
}
export async function verifiedUser(){const {data,error}=await (await authClient()).auth.getUser();return !error&&data.user&&!data.user.is_anonymous?data.user.id:null;}
