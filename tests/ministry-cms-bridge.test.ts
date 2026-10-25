import test from 'node:test';
import assert from 'node:assert/strict';
import type {PoolClient} from 'pg';
import {PGlite} from '@electric-sql/pglite';
import {readCmsWithConnection} from '../apps/ministry/src/lib/cms-bridge';
const user='11111111-1111-4111-8111-111111111111';
test('CMS bridge requires existing admin and care designation and never copies private request text',async()=>{
 const db=new PGlite();
 try{
  await db.exec('CREATE TABLE admin_profiles(id text,"authUserId" uuid,"isActive" boolean,role text); CREATE TABLE church_memberships("ownerId" uuid,status text,"realName" text,phone text,position text,version int); CREATE TABLE care_settings(id text,policy jsonb); CREATE TABLE member_care_requests(id text,"ownerId" uuid,status text,version int,"expiresAt" timestamptz,"createdAt" timestamptz,content jsonb);');
  await db.query('INSERT INTO admin_profiles VALUES($1,$2,true,$3)',['cms-admin',user,'ADMIN']);
  await db.query('INSERT INTO church_memberships VALUES($1,$2,$3,$4,$5,1)',[user,'CONFIRMED','Synthetic member','01000000000','Member']);
  await db.query('INSERT INTO care_settings VALUES($1,$2)',['CARE',{adminIds:['cms-admin']}]);
  await db.query('INSERT INTO member_care_requests VALUES($1,$2,$3,1,now()+interval \'1 day\',now(),$4)',['request',user,'RECEIVED',{kind:'VISIT',name:'Synthetic member',message:'NEVER COPY THIS PRIVATE TEXT',phone:'secret phone',location:'private location'}]);
  const connection={query:(sql:string,params?:unknown[])=>db.query(sql,params),release(){}} as unknown as Pick<PoolClient,'query'|'release'>;
  const data=await readCmsWithConnection(connection,user,true);assert.equal(data.accounts.length,1);assert.equal(data.care.length,1);assert.ok(!JSON.stringify(data).includes('NEVER COPY'));assert.ok(!JSON.stringify(data).includes('private location'));
  assert.equal((await readCmsWithConnection(connection,user,false)).care.length,0);
  await db.query('UPDATE care_settings SET policy=$1',[{adminIds:['different-admin']}]);assert.equal((await readCmsWithConnection(connection,user,true)).care.length,0);
  await assert.rejects(readCmsWithConnection(connection,'22222222-2222-4222-8222-222222222222',true));
  await db.exec('UPDATE admin_profiles SET "isActive"=false');await assert.rejects(readCmsWithConnection(connection,user,true));
 }finally{await db.close();}
});
