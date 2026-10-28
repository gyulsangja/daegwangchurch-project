import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getPrisma} from '@daegwang/database/prisma';
import {requireSupabaseConfig} from '@daegwang/config/env';
import {createContentManagement} from './management';
import {createContentManagementHandler} from './management-api';
import {createWorshipManagement} from './worship-management';
async function authenticate(token:string){
  const {url,publishableKey}=requireSupabaseConfig();
  const client=createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
  const {data,error}=await client.auth.getUser(token);
  if(error){if(error.status===401||error.status===403)return null;throw error;}
  return data.user&&!data.user.is_anonymous?data.user.id:null;
 }
export const churchContentManagement=createContentManagementHandler({
 authenticate,
 list:(user,input)=>createContentManagement(getPrisma()).list(user,input),
 save:(user,input)=>createContentManagement(getPrisma()).save(user,input),
});
export const worshipContentManagement=createContentManagementHandler({authenticate,list:(user,input)=>createWorshipManagement(getPrisma()).list(user,input),save:(user,input)=>createWorshipManagement(getPrisma()).save(user,input)});
