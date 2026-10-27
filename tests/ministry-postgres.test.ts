import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import type {Pool} from 'pg';
import {ministryTransaction,readMinistryRows,writeMinistryRows,appendMinistryAudits,MinistryAccessError} from '../packages/database/src/ministry-postgres';
const user='11111111-1111-4111-8111-111111111111';
test('PostgreSQL ministry isolation, explicit grants, rollback, composite FK and revocation',async()=>{
 const db=new PGlite();
 try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated,service_role;');
  await db.exec(readFileSync('packages/database/ministry/001_workspace.sql','utf8'));
  const api=await db.query<{count:number}>("SELECT count(*)::int AS count FROM information_schema.role_table_grants WHERE table_schema='ministry' AND grantee IN ('anon','authenticated','service_role')");assert.equal(api.rows[0].count,0);
  await db.exec(`CREATE ROLE ministry_test; GRANT USAGE ON SCHEMA ministry TO ministry_test; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ministry TO ministry_test;`);
  for(const id of ['one','two']){await db.query('INSERT INTO ministry.churches VALUES($1,$2)',[id,{id,name:id,statuses:[],positions:[]}]);await db.query('INSERT INTO ministry.members VALUES($1,$2,$3)',[id,`member-${id}`,{id:`member-${id}`,churchId:id}]);}
  await db.query('INSERT INTO ministry.access_grants(church_id,user_id,role,care) VALUES($1,$2,$3,true)',['one',user,'ADMIN']);
  const queries:string[]=[];
  const pool={connect:async()=>({query:(sql:string,params?:unknown[])=>{queries.push(sql);return db.query(sql,params);},release(){}})} as unknown as Pick<Pool,'connect'>;
  await assert.rejects(ministryTransaction(pool,user,'one',async()=>true),MinistryAccessError);
  await db.exec('SET ROLE ministry_test');
  const initial=await ministryTransaction(pool,user,'one',async(connection,grant)=>{assert.equal(grant.role,'ADMIN');return readMinistryRows(connection,'one');});
  assert.equal(initial.members.length,1);assert.equal(initial.members[0].id,'member-one');
  queries.length=0;
  const partial=await ministryTransaction(pool,user,'one',async connection=>{
   const data=await readMinistryRows(connection,'one',['members']);
   await appendMinistryAudits(connection,'one',[{id:'read-audit',payload:{id:'read-audit',action:'READ'}}]);
   return data;
  },{aal:'aal1',enforceMfa:false,readOnly:true});
  assert.deepEqual(partial.members,initial.members);assert.deepEqual(partial.records,[]);
  assert.equal(queries.filter(q=>q.includes('SELECT payload AS church')).length,1);
  assert.ok(!queries.some(q=>q.includes('FOR UPDATE')));
  assert.ok(queries.some(q=>q.includes('FOR SHARE')));
  assert.ok(!queries.some(q=>q.includes('FROM ministry.records')));
  assert.equal((await ministryTransaction(pool,user,'one',c=>readMinistryRows(c,'one'))).audits.length,1);
  await assert.rejects(ministryTransaction(pool,user,'two',async()=>true),MinistryAccessError);
  await assert.rejects(ministryTransaction(pool,'22222222-2222-4222-8222-222222222222','one',async()=>true),MinistryAccessError);
  await assert.rejects(ministryTransaction(pool,user,'one',async(connection)=>{
   await connection.query('INSERT INTO ministry.records(church_id,id,member_id,payload) VALUES($1,$2,$3,$4)',['one','bad','member-two',{}]);
  }));
  await assert.rejects(ministryTransaction(pool,user,'one',async(connection)=>{
   const before=await readMinistryRows(connection,'one');const after=structuredClone(before);after.members.push({id:'new',payload:{id:'new',churchId:'one'}});await writeMinistryRows(connection,'one',before,after);throw new Error('rollback');
  }));
  assert.equal((await ministryTransaction(pool,user,'one',connection=>readMinistryRows(connection,'one'))).members.length,1);
  await ministryTransaction(pool,user,'one',async(connection)=>{const before=await readMinistryRows(connection,'one');const after=structuredClone(before);after.records.push({id:'record',payload:{id:'record',memberId:'member-one',churchId:'one'}});await writeMinistryRows(connection,'one',before,after);});
  assert.equal((await ministryTransaction(pool,user,'one',connection=>readMinistryRows(connection,'one'))).records.length,1);
  // Runtime has no policy to grant itself privileges, even with UPDATE needed for row locking.
  await assert.rejects(ministryTransaction(pool,user,'one',async connection=>{await connection.query('UPDATE ministry.access_grants SET care=false WHERE church_id=$1',['one']);}));
  await db.exec('RESET ROLE');await db.query('UPDATE ministry.access_grants SET active=false WHERE church_id=$1',['one']);await db.exec('SET ROLE ministry_test');
  await assert.rejects(ministryTransaction(pool,user,'one',async()=>true),MinistryAccessError);
  await assert.rejects(ministryTransaction(pool,user,'one',async()=>true,{aal:'aal1',enforceMfa:false,readOnly:true}),MinistryAccessError);
 }finally{await db.close();}
});
