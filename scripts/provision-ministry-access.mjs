// Explicit operator command. No automatic production migration or account creation.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'dotenv';
import pg from 'pg';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const env=(file)=>{try{return parse(readFileSync(resolve(root,file)));}catch{return {};}};
const ministry=env('apps/ministry/.env.local'),sources=[env('apps/admin/.env.local'),env('apps/website/.env.local')];
const connection=sources.map(s=>s.DIRECT_URL).find(Boolean)||sources.map(s=>s.DATABASE_URL).find(Boolean);
const approved=process.argv.includes('--apply');const rootEmail='root@daegwangchurch.kr';
const db=new pg.Client({connectionString:connection,connectionTimeoutMillis:10000});
try{
 if(!connection||!ministry.MINISTRY_CHURCH_ID)throw new Error('Required connection not configured');
 await db.connect();const account=await db.query('SELECT id,email_confirmed_at FROM auth.users WHERE lower(email)=$1',[rootEmail]);
 if(account.rows.length!==1)throw new Error('Expected exactly one existing root account; no accounts created');
 if(!account.rows[0].email_confirmed_at)throw new Error('Existing root email is not confirmed; review separately without resetting its password');
 const church=await db.query('SELECT id FROM ministry.churches WHERE id=$1',[ministry.MINISTRY_CHURCH_ID]);if(church.rows.length!==1)throw new Error('Church not found');
 const current=await db.query("SELECT to_regprocedure('ministry.access_list()') IS NOT NULL AS ready");
 if(!approved){console.log(JSON.stringify({readyToApply:true,migrationRequired:!current.rows[0].ready,existingRootConfirmed:true,accountCreation:false,passwordChange:false}));}
 else{
  const backupDir=resolve(root,'.local/ministry/access-backups');mkdirSync(backupDir,{recursive:true});
  const grants=await db.query('SELECT * FROM ministry.access_grants WHERE church_id=$1',[ministry.MINISTRY_CHURCH_ID]);
  writeFileSync(resolve(backupDir,`grants-${Date.now()}.json`),JSON.stringify(grants.rows,null,2),{mode:0o600});
  await db.query('BEGIN');
  if(!current.rows[0].ready){const sql=readFileSync(resolve(root,'packages/database/ministry/002_access_management.sql'),'utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');await db.query(sql);}
  const optional=await db.query("SELECT to_regprocedure('ministry.access_change_verified(jsonb)') IS NOT NULL AS ready");
  if(!optional.rows[0].ready)await db.query(readFileSync(resolve(root,'packages/database/ministry/003_optional_mfa.sql'),'utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
  const target=account.rows[0].id;
  const previous=await db.query('SELECT to_jsonb(g) AS value FROM ministry.access_grants g WHERE church_id=$1 AND user_id=$2',[ministry.MINISTRY_CHURCH_ID,target]);
  await db.query(`INSERT INTO ministry.access_grants(church_id,user_id,role,care,active,display_name,can_print,can_delete)
   VALUES($1,$2,'ADMIN',true,true,'대광교회 최고관리자',true,true)
   ON CONFLICT(church_id,user_id) DO UPDATE SET role='ADMIN',care=true,active=true,display_name=excluded.display_name,can_print=true,can_delete=true,organization_ids='{}',scope_year=NULL,version=ministry.access_grants.version+1`,[ministry.MINISTRY_CHURCH_ID,target]);
  await db.query("INSERT INTO ministry.access_events(church_id,actor_id,subject,action,before_value,after_value,reason) VALUES($1,$2::uuid,$2::text,'BOOTSTRAP',$3,$4,'사용자 명시 승인: 기존 root 계정에 대광교회 전체 목회 권한 부여')",[ministry.MINISTRY_CHURCH_ID,target,previous.rows[0]?.value??null,{role:'ADMIN',care:true,print:true,delete:true,active:true}]);
  await db.query('COMMIT');
  const runtime=new pg.Client({connectionString:ministry.MINISTRY_DATABASE_URL,connectionTimeoutMillis:10000});try{await runtime.connect();const r=await runtime.query("SELECT rolsuper,rolbypassrls,has_function_privilege(current_user,'ministry.access_list()','EXECUTE') AS can_manage FROM pg_roles WHERE rolname=current_user");if(!r.rows[0]||r.rows[0].rolsuper||r.rows[0].rolbypassrls||!r.rows[0].can_manage)throw new Error('Runtime role validation failed; feature flag not enabled');}finally{await runtime.end();}
  const file=resolve(root,'apps/ministry/.env.local');let contents=readFileSync(file,'utf8');contents=/^MINISTRY_ACCESS_ENABLED=/m.test(contents)?contents.replace(/^MINISTRY_ACCESS_ENABLED=.*$/m,'MINISTRY_ACCESS_ENABLED=true'):`${contents.trimEnd()}\nMINISTRY_ACCESS_ENABLED=true\n`;writeFileSync(file,contents);
  console.log(JSON.stringify({migrationApplied:true,existingRootGrantedAll:true,passwordUnchanged:true,otherAdministratorsPreserved:true,mfaRequired:false,featureEnabled:true}));
 }
}catch(e){try{await db.query('ROLLBACK');}catch{}console.error('Provisioning stopped:',e.code||e.message);process.exitCode=1;}finally{await db.end();}
