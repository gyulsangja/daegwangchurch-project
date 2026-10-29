import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';
import {createDirectory,type Actor} from '../packages/ministry-core/src/directory';import {createFixture} from '../packages/ministry-core/src/fixture';import {directoryMethods,invokeDirectory} from '../packages/ministry-core/src/directory-dispatch';
import {readMinistrySummary} from '../packages/database/src/ministry-summary';import type {MinistryConnection} from '../packages/database/src/ministry-postgres';
test('council actors cannot dispatch private or mutable domain operations',()=>{
 const service=createDirectory(createFixture(),randomUUID),actor:Actor={id:'council',churchId:'demo-daegwang',role:'COUNCIL',organizationIds:[],permissions:[],canDelete:false,canPrint:false};
 assert.deepEqual(service.config(actor).organizations,[]);
 for(const [group,methods] of Object.entries(directoryMethods))for(const method of methods){if(group==='root'&&method==='config')continue;assert.throws(()=>invokeDirectory(service,group==='root'?undefined:group,method,[actor]),/FORBIDDEN/,group+'.'+method);}
});
test('council migration rejects private permissions and summaries contain only this church aggregate data',async()=>{
 const db=new PGlite();try{
  await db.exec('CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz);CREATE ROLE daegwang_ministry_runtime;');
  for(const f of ['001_workspace.sql','002_access_management.sql','003_optional_mfa.sql','004_content_operator.sql','007_content_workspace_delete.sql','008_council_summary_role.sql'])await db.exec(readFileSync(`packages/database/ministry/${f}`,'utf8'));
  await db.exec(`INSERT INTO ministry.churches VALUES('one','{"statuses":[{"code":"ACTIVE","label":"교인"}]}'),('two','{}');
   INSERT INTO ministry.members VALUES('one','m1','{"name":"PRIVATE PERSON","phone":"PRIVATE PHONE","status":"ACTIVE"}'),('two','m2','{"status":"OTHER CHURCH"}');
   INSERT INTO ministry.records VALUES('one','r1','m1','{"kind":"ATTENDANCE","date":"2026-10-01","value":"PRESENT","note":"PRIVATE NOTE"}'),('one','r2','m1','{"kind":"CARE","date":"2026-10-01","value":"SECRET"}'),('one','r3','m1','{"kind":"ATTENDANCE","date":"2026-09-01","value":"ABSENT"}');`);
  const input={role:'COUNCIL',name:'Council',organizations:[],year:null,care:false,print:false,delete:false};await db.query('SELECT ministry.access_validate($1)',[JSON.stringify(input)]);
  for(const patch of [{care:true},{print:true},{delete:true},{organizations:['other']},{year:2026}])await assert.rejects(db.query('SELECT ministry.access_validate($1)',[JSON.stringify({...input,...patch})]),/ACCESS_INVALID/);
  const summary=await readMinistrySummary(db as unknown as MinistryConnection,'one','2026-10');assert.equal(summary.total,1);assert.deepEqual(summary.members,[{name:'교인',count:1}]);assert.deepEqual(summary.attendance,[{state:'PRESENT',count:1}]);assert.doesNotMatch(JSON.stringify(summary),/PRIVATE|SECRET|OTHER CHURCH|ABSENT/);
  await db.exec('SET ROLE daegwang_ministry_runtime');await assert.rejects(db.query('SELECT ministry.access_validate_before_council($1)',[JSON.stringify(input)]),/permission denied/);
 }finally{await db.close();}
});
