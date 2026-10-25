// Explicit deployment utility; never invoked by build/dev or the CMS migration command.
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {Pool} from 'pg';
import {z} from 'zod';
import {createDirectory,type DirectoryState} from '../packages/ministry-core/src/directory';
const args=z.object({user:z.uuid(),church:z.string().regex(/^[a-z0-9-]{3,60}$/),name:z.string().trim().min(1).max(80),runtimeRole:z.string().regex(/^[a-z_][a-z0-9_]{2,60}$/)}).parse({user:process.env.MINISTRY_INITIAL_ADMIN_ID,church:process.env.MINISTRY_CHURCH_ID,name:process.env.MINISTRY_CHURCH_NAME??'대광교회',runtimeRole:process.env.MINISTRY_RUNTIME_ROLE});
if(!process.argv.includes('--apply')){
 console.log('Dry run: create isolated ministry schema, empty church/year, and one explicit administrator grant. No CMS rows or local fixtures are copied. Requires --apply and MINISTRY_MIGRATION_URL.');
}else{
 if(!process.env.MINISTRY_MIGRATION_URL)throw new Error('MINISTRY_MIGRATION_URL required');
 const pool=new Pool({connectionString:process.env.MINISTRY_MIGRATION_URL,max:1,connectionTimeoutMillis:10000});const db=await pool.connect();
 try{
  const role=await db.query('SELECT rolname,rolsuper,rolbypassrls,rolcanlogin FROM pg_roles WHERE rolname=$1',[args.runtimeRole]);
  if(role.rows.length!==1||role.rows[0].rolsuper||role.rows[0].rolbypassrls||!role.rows[0].rolcanlogin)throw new Error('Restricted runtime login must already exist');
  const owner=await db.query('SELECT current_user AS name');if(owner.rows[0].name===args.runtimeRole)throw new Error('Migration and runtime roles must differ');
  const state:DirectoryState={churches:[{id:args.church,name:args.name,statuses:[{code:'ACTIVE',label:'재적'},{code:'DECEASED',label:'소천'},{code:'TRANSFERRED',label:'이적'}],positions:[{code:'MEMBER',label:'성도'},{code:'DEACON',label:'집사'},{code:'ELDER',label:'장로'}]}],members:[],organizations:[],families:[],audits:[]};
  const initial=createDirectory(state,randomUUID).snapshot();
  const migration=readFileSync('packages/database/ministry/001_workspace.sql','utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'');
  await db.query('BEGIN');await db.query(migration);
  await db.query('INSERT INTO ministry.churches(id,payload) VALUES($1,$2)',[args.church,initial.state.churches[0]]);
  for(const year of initial.years)await db.query('INSERT INTO ministry.years(church_id,id,payload) VALUES($1,$2,$3)',[args.church,String(year.year),year]);
  await db.query('INSERT INTO ministry.access_grants(church_id,user_id,role,care) VALUES($1,$2,$3,true)',[args.church,args.user,'ADMIN']);
  // Identifiers are constrained above; passwords are never accepted or printed by this script.
  await db.query(`GRANT USAGE ON SCHEMA ministry TO "${args.runtimeRole}"`);
  await db.query(`GRANT SELECT,UPDATE ON ministry.churches,ministry.access_grants TO "${args.runtimeRole}"`);
  await db.query(`GRANT SELECT,INSERT,UPDATE ON ministry.members,ministry.organizations,ministry.families,ministry.years,ministry.records,ministry.pastoral,ministry.attendance_sessions,ministry.audits,ministry.account_links,ministry.care_intakes TO "${args.runtimeRole}"`);
  await db.query(`GRANT DELETE ON ministry.organizations TO "${args.runtimeRole}"`);
  await db.query('COMMIT');console.log('Ministry schema, empty church/year and explicit grant initialized. Application activation and real-login verification are still required.');
 }catch{await db.query('ROLLBACK');console.error('Ministry initialization failed and rolled back. Check the migration role, existing schema and approved configuration. Credentials and SQL parameters are not printed.');process.exitCode=1;}
 finally{db.release();await pool.end();}
}
