import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getPrisma} from '@daegwang/database/prisma';
import {requireSupabaseConfig} from '@daegwang/config/env';
import {createContentManagement} from './management';
import {createContentManagementHandler} from './management-api';
export const churchContentManagement=createContentManagementHandler({
 async authenticate(token){
  const {url,publishableKey}=requireSupabaseConfig();
  const client=createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
  const {data,error}=await client.auth.getUser(token);
  if(error){if(error.status===401||error.status===403)return null;throw error;}
  return data.user&&!data.user.is_anonymous?data.user.id:null;
 },
 list:(user,input)=>createContentManagement(getPrisma()).list(user,input),
 save:(user,input)=>createContentManagement(getPrisma()).save(user,input),
});
