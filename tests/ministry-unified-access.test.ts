import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {accessChange,type AccessSnapshot} from '../packages/contracts/src/ministry-access';
const root='11111111-1111-4111-8111-111111111111',office='22222222-2222-4222-8222-222222222222',limited='33333333-3333-4333-8333-333333333333';
test('unified access changes both grants atomically with separate authority, versions and self protection',async()=>{
 const db=new PGlite();try{
  await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,deleted_at timestamptz,is_anonymous boolean);
   CREATE ROLE daegwang_ministry_runtime; CREATE TYPE public."AdminRole" AS ENUM ('ADMIN','SUPER_ADMIN');
   CREATE TABLE public.admin_profiles(id text PRIMARY KEY,"authUserId" uuid UNIQUE,email text UNIQUE,"displayName" text,role public."AdminRole","isActive" boolean,"createdAt" timestamp(3),"updatedAt" timestamp(3));
   CREATE TABLE public.group_managers("groupId" text,"adminId" text); CREATE TABLE public.member_deletions("ownerId" uuid PRIMARY KEY);`);
  for(const f of ['001_workspace.sql','002_access_management.sql','003_optional_mfa.sql','004_content_operator.sql','006_unified_access_management.sql','007_content_workspace_delete.sql'])await db.exec(readFileSync(`packages/database/ministry/${f}`,'utf8'));
  await db.exec('GRANT USAGE ON SCHEMA ministry TO daegwang_ministry_runtime;');
  for(const [id,email] of [[root,'root@example.test'],[office,'office@example.test'],[limited,'limited@example.test']])await db.query('INSERT INTO auth.users VALUES($1,$2,now(),NULL,false)',[id,email]);
  await db.exec("INSERT INTO ministry.churches VALUES('one','{}'),('two','{}');");
  await db.query("INSERT INTO ministry.access_grants(church_id,user_id,role) VALUES('one',$1,'ADMIN'),('one',$2,'OFFICE'),('one',$3,'ADMIN')",[root,office,limited]);
  await db.query(`INSERT INTO public.admin_profiles VALUES('root',$1,'root@example.test','Root','SUPER_ADMIN',true,now(),now()),('office',$2,'office@example.test','Office','ADMIN',true,now(),now())`,[root,office]);
  await db.exec("INSERT INTO public.group_managers VALUES('group','office'); SET ROLE daegwang_ministry_runtime;");
  const ctx=(user=root,church='one',aal='aal2')=>db.query("SELECT set_config('ministry.user_id',$1,false),set_config('ministry.church_id',$2,false),set_config('ministry.aal',$3,false)",[user,church,aal]);
  const list=async()=>(await db.query<{v:AccessSnapshot}>('SELECT ministry.management_access_list() v')).rows[0].v;
  const change=(v:unknown)=>db.query('SELECT ministry.management_access_change($1::jsonb)',[JSON.stringify(v)]);
  await ctx();let snapshot=await list();assert.equal(snapshot.canManageCms,true);const row=snapshot.users.find(x=>x.id===office)!;
  const input={action:'UPDATE',id:office,version:1,active:true,name:'Operator',role:'CONTENT',care:false,print:false,delete:true,organizations:[],year:null,reason:'Combined change',cmsRole:'NONE',cmsVersion:row.cmsVersion};
  for(const patch of [{care:true},{print:true},{organizations:['other']},{year:2026}])await assert.rejects(change({...input,...patch}),/ACCESS_INVALID/);
  assert.ok(accessChange.safeParse(input).success);assert.equal(accessChange.safeParse({...input,cmsVersion:undefined}).success,false);
  await assert.rejects(change({...input,version:999}),/ACCESS_CONFLICT/);assert.equal((await list()).users.find(x=>x.id===office)!.cmsRole,'ADMIN');
  await assert.rejects(change({...input,cmsVersion:'2000-01-01T00:00:00.000Z'}),/ACCESS_CONFLICT/);
  await ctx(limited);assert.equal((await list()).canManageCms,false);await assert.rejects(change(input),/ACCESS_CMS_FORBIDDEN/);
  await ctx(root,'two');await assert.rejects(list(),/ACCESS_FORBIDDEN/);
  await ctx(root,'one','aal1');await assert.rejects(change(input),/ACCESS_REAUTH/);
  await ctx();await change(input);snapshot=await list();const updated=snapshot.users.find(x=>x.id===office)!;assert.equal(updated.role,'CONTENT');assert.equal(updated.cmsRole,'NONE');assert.equal(updated.version,2);assert.ok(snapshot.events.some(x=>x.action==='CONTENT_ACCESS'));
  await assert.rejects(change(input),/ACCESS_CONFLICT/);
  await db.exec('RESET ROLE');assert.equal((await db.query('SELECT * FROM public.group_managers')).rows.length,0);await db.exec('SET ROLE daegwang_ministry_runtime');
  const self=snapshot.users.find(x=>x.id===root)!;await assert.rejects(change({...input,id:root,role:'ADMIN',cmsVersion:self.cmsVersion}),/ACCESS_SELF|ACCESS_LAST_ADMIN/);
  await ctx(office);await assert.rejects(list(),/ACCESS_FORBIDDEN/);await assert.rejects(db.query("UPDATE public.admin_profiles SET role='SUPER_ADMIN'"),/permission denied/);
  // New CMS profile creation is explicit and does not modify the ministry care permission.
  await ctx();const candidate=(await list()).users.find(x=>x.id===limited)!;
  await change({...input,id:limited,role:'ADMIN',cmsRole:'ADMIN',cmsVersion:candidate.cmsVersion});
  const granted=(await list()).users.find(x=>x.id===limited)!;assert.equal(granted.cmsRole,'ADMIN');assert.equal(granted.care,false);
 }finally{await db.close();}
});
