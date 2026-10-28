import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getPrisma} from '@daegwang/database/prisma';
import {requireSupabaseConfig} from '@daegwang/config/env';
import {createContentManagement} from './management';
import {createContentManagementHandler} from './management-api';
import {createWorshipManagement} from './worship-management';
import {manageBulletinUpload} from '../bulletins/upload-server';
import {createIntakeManagement} from './intake-management';
import {createMemberAccountManagement} from './member-account-management';
import {memberDeletionProvider} from '../member/admin-deletion-provider';
import {createGroupManagement} from './group-management';
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
export const intakeManagement=createContentManagementHandler({authenticate,list:(user,input)=>createIntakeManagement(getPrisma()).list(user,input),save:(user,input)=>createIntakeManagement(getPrisma()).save(user,input)});
const memberAccounts=()=>createMemberAccountManagement(getPrisma(),{membershipEnabled:process.env.APP_CHURCH_MEMBERSHIP_ENABLED==='true',provider:memberDeletionProvider()});
export const memberAccountManagement=createContentManagementHandler({authenticate,list:(user,input)=>memberAccounts().list(user,input),save:(user,input)=>memberAccounts().save(user,input)});
export const groupManagement=createContentManagementHandler({authenticate,list:(user,input)=>createGroupManagement(getPrisma(),process.env.APP_GROUPS_ENABLED==='true').list(user,input),save:(user,input)=>createGroupManagement(getPrisma(),process.env.APP_GROUPS_ENABLED==='true').save(user,input)});
export const worshipContentManagement=createContentManagementHandler({authenticate,list:(user,input)=>createWorshipManagement(getPrisma(),requireSupabaseConfig().url).list(user,input),save:(user,input)=>input&&typeof input==='object'&&'operation'in input&&['PREPARE_PDF','SAVE_PDF'].includes(String(input.operation))?manageBulletinUpload(user,input):createWorshipManagement(getPrisma(),requireSupabaseConfig().url).save(user,input)});
