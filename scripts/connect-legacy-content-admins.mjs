// Explicitly approved transition. Never reactivate or overwrite existing ministry grants.
import {readFileSync} from 'node:fs';import {parse} from 'dotenv';import pg from 'pg';
const env=parse(readFileSync('apps/admin/.env.local')),m=parse(readFileSync('apps/ministry/.env.local'));
const db=new pg.Client({connectionString:env.DIRECT_URL||env.DATABASE_URL,connectionTimeoutMillis:10000});
try{await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
 const church=await db.query('SELECT id FROM ministry.churches WHERE id=$1 FOR UPDATE',[m.MINISTRY_CHURCH_ID]);if(church.rowCount!==1)throw Error('CHURCH_MISSING');
 await db.query("SELECT pg_advisory_xact_lock(hashtextextended('admin-member-management',0))");
 const missing=await db.query(`SELECT a."authUserId" id,a."displayName" name FROM public.admin_profiles a JOIN auth.users u ON u.id=a."authUserId" WHERE a."isActive" AND u.deleted_at IS NULL AND NOT coalesce(u.is_anonymous,false) AND NOT EXISTS(SELECT 1 FROM ministry.access_grants g WHERE g.church_id=$1 AND g.user_id=a."authUserId")`,[m.MINISTRY_CHURCH_ID]);
 if(!process.argv.includes('--apply')){await db.query('ROLLBACK');console.log(JSON.stringify({missingContentAccounts:missing.rowCount,reactivateExisting:false}));}
 else{
  const owner=await db.query("SELECT g.user_id FROM ministry.access_grants g JOIN public.admin_profiles a ON a.\"authUserId\"=g.user_id WHERE g.church_id=$1 AND g.active AND g.role='ADMIN' AND a.\"isActive\" AND a.role::text='SUPER_ADMIN' ORDER BY g.user_id LIMIT 1",[m.MINISTRY_CHURCH_ID]);if(owner.rowCount!==1)throw Error('OWNER_MISSING');
  const council=await db.query("SELECT to_regprocedure('ministry.access_validate_before_council(jsonb)') IS NOT NULL ready");
  if(!council.rows[0].ready)await db.query(readFileSync('packages/database/ministry/007_content_workspace_delete.sql','utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
  for(const row of missing.rows){await db.query("INSERT INTO ministry.access_grants(church_id,user_id,role,care,active,display_name,can_print,can_delete) VALUES($1,$2,'CONTENT',false,true,$3,false,true)",[m.MINISTRY_CHURCH_ID,row.id,row.name]);await db.query("INSERT INTO ministry.access_events(church_id,actor_id,subject,action,after_value,reason) VALUES($1,$2,$3,'CONTENT_CONNECT',$4,'사용자 승인: 기존 CMS 관리자의 공개 콘텐츠 업무를 통합 관리로 연결')",[m.MINISTRY_CHURCH_ID,owner.rows[0].user_id,row.id,JSON.stringify({role:'CONTENT',care:false,print:false,delete:true})]);}
  await db.query('COMMIT');console.log(JSON.stringify({connected:missing.rowCount,existingGrantsUnchanged:true,noPastoralAccessGranted:true}));
 }
}catch(e){try{await db.query('ROLLBACK');}catch{}console.error(e.code||e.message);process.exitCode=1;}finally{await db.end();}
