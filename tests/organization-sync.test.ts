import test from 'node:test';import assert from 'node:assert/strict';
import {organizationGroupChanges,mapOrganizationGroup} from '../packages/ministry-core/src/organization-sync';
import type {MinistryYear} from '../packages/ministry-core/src/years';
import {readOrganizationSyncSource,writeOrganizationGroupMapping} from '../packages/database/src/ministry-organization-sync';
import type {MinistryConnection,MinistryGrant} from '../packages/database/src/ministry-postgres';
import {PGlite} from '@electric-sql/pglite';
const period={churchId:'one',year:2026,state:'ACTIVE',version:3,organizations:[{id:'youth',name:'Youth',appGroupId:'group'},{id:'adult',name:'Adult'}],assignments:[{memberId:'one',affiliations:[{organizationId:'youth'}]},{memberId:'two',affiliations:[{organizationId:'adult'}]},{memberId:'three',affiliations:[{organizationId:'youth'}]},{memberId:'four',affiliations:[{organizationId:'youth'}]}],events:[]} as unknown as MinistryYear;
test('organization sync proposes only explicit linked accounts, preserves unlinked members and does not promote ineligible accounts',()=>{
 const links=[{memberId:'one',userId:'a'},{memberId:'two',userId:'b'},{memberId:'four',userId:'d'}],accounts=[{ownerId:'a',name:'A',eligible:true,approved:false},{ownerId:'b',name:'B',eligible:true,approved:true},{ownerId:'c',name:'C',eligible:true,approved:true},{ownerId:'d',name:'D',eligible:false,approved:false}];
 assert.deepEqual(organizationGroupChanges(period,links,accounts,'group'),{unlinked:1,ineligible:1,changes:[{ownerId:'a',name:'A',expectedMember:false,approved:true},{ownerId:'b',name:'B',expectedMember:true,approved:false}]});
 assert.deepEqual(organizationGroupChanges(period,links,accounts,'unmapped'),{unlinked:0,ineligible:0,changes:[]});assert.throws(()=>organizationGroupChanges({...period,state:'DRAFT'},links,accounts,'group'),/운영 중/);
});
test('mapping edits are versioned, preserve annual history and never mutate membership; other group assignments cannot be taken over',()=>{
 const next=mapOrganizationGroup(period,'group',['adult'],3,'actor','2026-10-29');assert.equal(period.organizations[0].appGroupId,'group');assert.equal(next.organizations[0].appGroupId,undefined);assert.equal(next.organizations[1].appGroupId,'group');assert.equal(next.version,4);assert.deepEqual(next.assignments,period.assignments);assert.equal(next.events[0].action,'APP_GROUP_LINK');
 assert.throws(()=>mapOrganizationGroup(period,'group',['adult'],2,'actor','now'),/운영 연도/);assert.throws(()=>mapOrganizationGroup(period,'other',['youth'],3,'actor','now'),/다른 앱/);assert.throws(()=>mapOrganizationGroup({...period,state:'ARCHIVED'},'group',[],3,'actor','now'));
});
test('database sync source selects only the church active year and mappings use version checks',async()=>{
 const db=new PGlite();try{await db.exec('CREATE SCHEMA ministry; CREATE TABLE ministry.years(church_id text,id text,payload jsonb);CREATE TABLE ministry.account_links(church_id text,member_id text,user_id uuid);');
 await db.query('INSERT INTO ministry.years VALUES($1,$2,$3),($4,$2,$5)',['one','2026',period,'two',{...period,churchId:'two'}]);await db.query('INSERT INTO ministry.account_links VALUES($1,$2,$3)',['two','private','11111111-1111-4111-8111-111111111111']);
 const connection={query:async(sql:string,params:unknown[])=>{const result=await db.query(sql,params);return {...result,rowCount:result.affectedRows};}} as unknown as MinistryConnection;
 const grant={churchId:'one',userId:'actor',role:'ADMIN'} as MinistryGrant;const source=await readOrganizationSyncSource<MinistryYear>(connection,grant);assert.equal(source.period.churchId,'one');assert.deepEqual(source.links,[]);await assert.rejects(readOrganizationSyncSource(connection,{...grant,role:'CONTENT'}));
 const next=mapOrganizationGroup(period,'group',['adult'],3,'actor','now');await writeOrganizationGroupMapping(connection,grant,next,3);await assert.rejects(writeOrganizationGroupMapping(connection,grant,next,3),/CONFLICT/);await assert.rejects(writeOrganizationGroupMapping(connection,{...grant,churchId:'two'},next,4));assert.equal((await readOrganizationSyncSource<MinistryYear>(connection,grant)).period.version,4);
 }finally{await db.close();}
});
