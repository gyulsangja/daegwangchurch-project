// Dry-run by default. Applies only the role definition, never changes any user's grant.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'dotenv';
import pg from 'pg';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const env=parse(readFileSync(resolve(root,'apps/admin/.env.local')));
const db=new pg.Client({connectionString:env.DIRECT_URL||env.DATABASE_URL,connectionTimeoutMillis:10000});
try{
 await db.connect();
 await db.query('BEGIN');
 await db.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
 const prerequisite=await db.query("SELECT to_regprocedure('ministry.access_change_verified(jsonb)') IS NOT NULL AS ready");
 if(!prerequisite.rows[0].ready)throw new Error('Prior access migrations are required');
 const existing=await db.query("SELECT count(*)::integer AS count FROM pg_constraint WHERE connamespace='ministry'::regnamespace AND conname IN ('content_role_limits','content_invitation_limits')");
 if(existing.rows[0].count===1)throw new Error('Partial migration requires review');
 const needed=existing.rows[0].count===0;
 if(process.argv.includes('--apply')&&needed){
  await db.query('LOCK TABLE ministry.access_grants,ministry.access_invitations IN SHARE ROW EXCLUSIVE MODE');
  const definitions=await db.query("SELECT pg_get_functiondef('ministry.access_validate(jsonb)'::regprocedure) AS function, (SELECT jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'definition',pg_get_constraintdef(oid))) FROM pg_constraint WHERE connamespace='ministry'::regnamespace AND conname IN ('access_grants_role_check','access_invitations_role_check')) AS constraints");
  const folder=resolve(root,'.local/ministry/content-role-backups');mkdirSync(folder,{recursive:true});writeFileSync(resolve(folder,`definitions-${Date.now()}.json`),JSON.stringify(definitions.rows),{mode:0o600});
  await db.query(readFileSync(resolve(root,'packages/database/ministry/004_content_operator.sql'),'utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
 }
 await db.query('COMMIT');
 console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'dry-run',migrationRequired:needed,userGrantsChanged:false,accountCreation:false}));
}catch(error){await db.query('ROLLBACK').catch(()=>{});console.error(error instanceof Error?error.message:'Migration failed');process.exitCode=1;}finally{await db.end();}
