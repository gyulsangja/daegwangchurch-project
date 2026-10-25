import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {parse} from 'dotenv';
import {Pool} from 'pg';
import {randomUUID,createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import {ministryTransaction,readMinistryRows,MinistryAccessError} from '../packages/database/src/ministry-postgres';
const env={...parse(readFileSync('packages/database/.env')),...parse(readFileSync('apps/admin/.env.local'))};
const runtime=parse(readFileSync('apps/ministry/.env.local'));
const owner=new Pool({connectionString:env.DIRECT_URL||env.DATABASE_URL,max:1,connectionTimeoutMillis:10000});
const app=new Pool({connectionString:runtime.MINISTRY_DATABASE_URL,max:2,connectionTimeoutMillis:10000});
const tables=['churches','access_grants','members','organizations','families','years','records','pastoral','attendance_sessions','audits','account_links','care_intakes'];
try{
 const user=(await owner.query('SELECT id FROM auth.users WHERE lower(email)=lower($1) AND deleted_at IS NULL',[process.env.MINISTRY_INITIAL_ADMIN_EMAIL])).rows;
 assert.equal(user.length,1);const id=user[0].id as string;const church=runtime.MINISTRY_CHURCH_ID;
 const [first,second]=await Promise.all([1,2].map(()=>ministryTransaction(app,id,church,db=>readMinistryRows(db,church))));
 assert.equal(first.members.length,0);assert.equal(second.years.length,1);
 await assert.rejects(ministryTransaction(app,randomUUID(),church,async()=>true),MinistryAccessError);
 await assert.rejects(ministryTransaction(app,id,'unapproved-church',async()=>true),MinistryAccessError);
 await assert.rejects(ministryTransaction(app,id,church,async db=>{await db.query('INSERT INTO ministry.members(church_id,id,payload) VALUES($1,$2,$3)',[church,'rollback-verification',{id:'rollback-verification',churchId:church}]);throw new Error('ROLLBACK_PROBE');}));
 assert.equal((await ministryTransaction(app,id,church,db=>readMinistryRows(db,church))).members.length,0);
 await assert.rejects(app.query('SELECT id FROM public.admin_profiles LIMIT 1'));
 const security=await owner.query("SELECT count(*)::int AS count,bool_and(c.relrowsecurity AND c.relforcerowsecurity) AS protected FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='ministry' AND c.relkind='r'");
 assert.equal(security.rows[0].count,tables.length);assert.equal(security.rows[0].protected,true);
 const api=await owner.query("SELECT count(*)::int AS count FROM information_schema.role_table_grants WHERE table_schema='ministry' AND grantee IN ('anon','authenticated','service_role','PUBLIC')");assert.equal(api.rows[0].count,0);
 // Capture only the newly approved ministry schema, never the existing CMS/auth tables.
 const backup:Record<string,Record<string,unknown>[]>={};for(const table of tables)backup[table]=(await owner.query(`SELECT * FROM ministry.${table}`)).rows;
 const data=JSON.stringify({format:1,schema:'ministry',createdAt:new Date().toISOString(),tables:backup});mkdirSync('.local/ministry/backups',{recursive:true});
 const filename=`.local/ministry/backups/operational-${Date.now()}.json`;writeFileSync(filename,data,{flag:'wx'});
 writeFileSync(`${filename}.sha256`,createHash('sha256').update(data).digest('hex'),{flag:'wx'});
 const restored=new PGlite();try{
  await restored.exec(readFileSync('packages/database/ministry/001_workspace.sql','utf8'));
  for(const table of tables)for(const row of backup[table]){const columns=Object.keys(row);assert.ok(columns.every(c=>/^[a-z_]+$/.test(c)));await restored.query(`INSERT INTO ministry.${table}(${columns.join(',')}) VALUES(${columns.map((_,i)=>`$${i+1}`).join(',')})`,Object.values(row));}
  assert.equal((await restored.query<{count:number}>('SELECT count(*)::int AS count FROM ministry.access_grants')).rows[0].count,1);
  assert.equal((await restored.query<{count:number}>('SELECT count(*)::int AS count FROM ministry.members')).rows[0].count,0);
 }finally{await restored.close();}
 console.log('Verified: restricted runtime login, two pooled calls, denied unapproved user/church, full rollback, no CMS table access, FORCE RLS on 12 tables, no public API-role grants, and isolated backup restore.');
}catch(error){console.error('Live verification failed: '+((error as {code?:string}).code??(error as Error).name));process.exitCode=1;}
finally{await owner.end();await app.end();}
