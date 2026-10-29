// Explicitly approved production command. Adds functions only; does not migrate user privileges.
import {readFileSync,writeFileSync} from 'node:fs';import {parse} from 'dotenv';import pg from 'pg';
const admin=parse(readFileSync('apps/admin/.env.local')),ministry=parse(readFileSync('apps/ministry/.env.local'));
const db=new pg.Client({connectionString:admin.DIRECT_URL||admin.DATABASE_URL,connectionTimeoutMillis:10000});
const fingerprint=`SELECT md5(coalesce((SELECT jsonb_agg(to_jsonb(g) ORDER BY church_id,user_id)::text FROM ministry.access_grants g),'')) grants,md5(coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY id)::text FROM public.admin_profiles a),'')) profiles`;
try{
 await db.connect();
 const state=await db.query("SELECT to_regprocedure('ministry.management_access_list()') IS NOT NULL a,to_regprocedure('ministry.management_access_change(jsonb)') IS NOT NULL b");
 if(state.rows[0].a!==state.rows[0].b)throw Error('PARTIAL_MIGRATION_REQUIRES_REVIEW');
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({ready:true,alreadyApplied:state.rows[0].a,changesExistingPrivileges:false}));}
 else{
  await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
  const before=(await db.query(fingerprint)).rows[0];
  if(!state.rows[0].a)await db.query(readFileSync('packages/database/ministry/006_unified_access_management.sql','utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
  const after=(await db.query(fingerprint)).rows[0];if(JSON.stringify(before)!==JSON.stringify(after))throw Error('UNEXPECTED_PRIVILEGE_CHANGE');
  await db.query('COMMIT');
  const runtime=new pg.Client({connectionString:ministry.MINISTRY_DATABASE_URL,connectionTimeoutMillis:10000});
  try{await runtime.connect();const result=await runtime.query("SELECT rolsuper,rolbypassrls,has_function_privilege(current_user,'ministry.management_access_list()','EXECUTE') AND has_function_privilege(current_user,'ministry.management_access_change(jsonb)','EXECUTE') allowed FROM pg_roles WHERE rolname=current_user");
   const row=result.rows[0];if(!row||row.rolsuper||row.rolbypassrls||!row.allowed)throw Error('RUNTIME_PRIVILEGE_INVALID');
   let denied=false;try{await runtime.query('SELECT ministry.management_access_list()');}catch(e){if(e.message?.includes('ACCESS_FORBIDDEN'))denied=true;else throw e;}if(!denied)throw Error('UNAUTHENTICATED_ACCESS');
  }finally{await runtime.end();}
  const path='apps/ministry/.env.local';let contents=readFileSync(path,'utf8');contents=/^MINISTRY_UNIFIED_ACCESS_ENABLED=/m.test(contents)?contents.replace(/^MINISTRY_UNIFIED_ACCESS_ENABLED=.*$/m,'MINISTRY_UNIFIED_ACCESS_ENABLED=true'):contents.trimEnd()+'\nMINISTRY_UNIFIED_ACCESS_ENABLED=true\n';writeFileSync(path,contents);
  console.log(JSON.stringify({applied:true,existingPrivilegesUnchanged:true,runtimeLeastPrivilege:true,unauthenticatedDenied:true,localFeatureEnabled:true}));
 }
}catch(e){try{await db.query('ROLLBACK');}catch{}console.error(e.code||e.message);process.exitCode=1;}finally{await db.end();}
