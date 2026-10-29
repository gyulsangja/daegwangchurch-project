// Explicitly approved role definition. Never assigns the role to an account.
import {readFileSync} from 'node:fs';import {parse} from 'dotenv';import pg from 'pg';
const env=parse(readFileSync('apps/admin/.env.local')),db=new pg.Client({connectionString:env.DIRECT_URL||env.DATABASE_URL,connectionTimeoutMillis:10000});
try{await db.connect();const state=await db.query("SELECT to_regprocedure('ministry.access_validate_before_council(jsonb)') IS NOT NULL ready");
 if(!process.argv.includes('--apply'))console.log(JSON.stringify({alreadyApplied:state.rows[0].ready,assignmentsChanged:false}));
 else if(state.rows[0].ready)console.log(JSON.stringify({alreadyApplied:true,assignmentsChanged:false}));
 else{await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");const fingerprint="SELECT md5(coalesce(jsonb_agg(to_jsonb(g) ORDER BY church_id,user_id)::text,'')) value FROM ministry.access_grants g";const before=(await db.query(fingerprint)).rows[0].value;
  await db.query(readFileSync('packages/database/ministry/008_council_summary_role.sql','utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
  if(before!==(await db.query(fingerprint)).rows[0].value)throw Error('UNEXPECTED_GRANT_CHANGE');
  await db.query("SELECT ministry.access_validate($1::jsonb)",[JSON.stringify({name:'Validation only',role:'COUNCIL',care:false,print:false,delete:false,organizations:[],year:null})]);await db.query('COMMIT');console.log(JSON.stringify({roleAdded:true,assignmentsChanged:false}));
 }
}catch(e){try{await db.query('ROLLBACK');}catch{}console.error(e.code||e.message);process.exitCode=1;}finally{await db.end();}
