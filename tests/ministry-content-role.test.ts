import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {createDirectory,type Actor} from '../packages/ministry-core/src/directory';
import {createFixture} from '../packages/ministry-core/src/fixture';
import {directoryMethods,invokeDirectory} from '../packages/ministry-core/src/directory-dispatch';
import {contentOnlyPathAllowed} from '../packages/ministry-core/src/content-access';
test('content-only actor cannot dispatch any pastoral domain operation or see organization metadata',()=>{
 const service=createDirectory(createFixture(),randomUUID);
 const actor:Actor={id:'content',churchId:'demo-daegwang',role:'CONTENT',organizationIds:[],permissions:[],canPrint:false,canDelete:true};
 const config=service.config(actor);assert.deepEqual(config.organizations,[]);assert.deepEqual(config.statuses,[]);assert.deepEqual(config.positions,[]);
 for(const [group,methods] of Object.entries(directoryMethods))for(const method of methods){
  if(group==='root'&&method==='config')continue;
  assert.throws(()=>invokeDirectory(service,group==='root'?undefined:group,method,[actor]),/FORBIDDEN/);
 }
 for(const path of ['/','/members','/care','/users','/statistics','/print','/church/manage/other'])assert.equal(contentOnlyPathAllowed(path),false);
 assert.ok(contentOnlyPathAllowed('/church'));assert.ok(contentOnlyPathAllowed('/church/manage'));
 for(const path of ['/worship','/app-groups','/albums','/church-guide','/site-pages','/church-settings'])assert.ok(contentOnlyPathAllowed(path));
 for(const path of ['/worship/print','/intake','/management','/app-members'])assert.equal(contentOnlyPathAllowed(path),false);
});
test('account linking candidates use one scoped summary without private histories',()=>{
 const service=createDirectory(createFixture(),randomUUID);const actor:Actor={id:'root',churchId:'demo-daegwang',role:'ADMIN',organizationIds:[]};
 const rows=service.linkCandidates(actor);assert.ok(rows.length>0);
 for(const row of rows)assert.deepEqual(Object.keys(row).sort(),['id','name','phone','version']);
 assert.equal(service.snapshot().state.audits.filter(a=>a.fields.includes('accountLinkCandidates')).length,1);
 for(const role of ['OFFICE','LEADER','CONTENT'] as const)assert.throws(()=>service.linkCandidates({...actor,role}));
 assert.throws(()=>service.linkCandidates({...actor,churchId:'other'}));
});
test('content role migration enforces no care, print, organization or access management privileges',async()=>{
 const db=new PGlite();const admin='11111111-1111-4111-8111-111111111111',operator='22222222-2222-4222-8222-222222222222';
 try{
  await db.exec('CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz); CREATE ROLE daegwang_ministry_runtime;');
  for(const file of ['001_workspace.sql','002_access_management.sql','003_optional_mfa.sql','004_content_operator.sql'])await db.exec(readFileSync(`packages/database/ministry/${file}`,'utf8'));
  await db.exec('GRANT USAGE ON SCHEMA ministry TO daegwang_ministry_runtime; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ministry TO daegwang_ministry_runtime;');
  await db.query('INSERT INTO auth.users VALUES($1,$2,now()),($3,$4,now())',[admin,'admin@example.test',operator,'content@example.test']);
  await db.exec("INSERT INTO ministry.churches VALUES('one','{}');");
  await db.query("INSERT INTO ministry.access_grants(church_id,user_id,role) VALUES('one',$1,'ADMIN'),('one',$2,'OFFICE')",[admin,operator]);
  await db.exec('SET ROLE daegwang_ministry_runtime');
  const context=(user:string)=>db.query("SELECT set_config('ministry.user_id',$1,false),set_config('ministry.church_id','one',false),set_config('ministry.aal','aal2',false)",[user]);
  await context(admin);
  const fields={action:'UPDATE',id:operator,version:1,active:true,name:'Content operator',role:'CONTENT',care:false,print:false,delete:false,organizations:[],year:null,reason:'Test role isolation'};
  for(const patch of [{care:true},{print:true},{delete:true},{organizations:['other']},{year:2026}])await assert.rejects(db.query('SELECT ministry.access_change($1::jsonb)',[JSON.stringify({...fields,...patch})]),/ACCESS_INVALID/);
  await db.query('SELECT ministry.access_change($1::jsonb)',[JSON.stringify(fields)]);
  await context(operator);const grant=(await db.query<{role:string;care:boolean;can_print:boolean}>('SELECT role,care,can_print FROM ministry.access_grants WHERE user_id=$1',[operator])).rows[0];
  assert.deepEqual(grant,{role:'CONTENT',care:false,can_print:false});
  await assert.rejects(db.query('SELECT ministry.access_list()'),/ACCESS_FORBIDDEN/);
  await assert.rejects(db.query('SELECT ministry.access_change($1::jsonb)',[JSON.stringify({...fields,version:2,role:'ADMIN'})]),/ACCESS_FORBIDDEN/);
 }finally{await db.close();}
});
