import test from 'node:test';import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createSiteSettingsManagement} from '../packages/server/src/features/church-content/site-settings-management';
import {siteSettingsCommand,siteSettingsPage} from '../packages/contracts/src/site-settings-management';
function fixture(){let active=true,auditFails=false;let row={id:'site',singletonKey:'SITE',updatedAt:new Date('2026-10-29T00:00:00Z'),siteName:'Fixture',canonicalUrl:'https://example.invalid',description:'',mapLatitude:0,mapLongitude:0,contactOptions:{transitInfo:'Bus',customOption:'preserved'},socialLinks:{existing:true},seoDefaults:{existing:true}};let logs=0;let reads=0;
 const db={$transaction:async<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>)=>{let draft=structuredClone(row);let count=logs;const result=await work({adminProfile:{findUnique:async()=>({id:'admin',isActive:active,role:'ADMIN'})},$executeRaw:async()=>0,siteSetting:{findUnique:async()=>{reads++;return draft;},upsert:async({update}:{update:object})=>{draft={...draft,...update,updatedAt:new Date(draft.updatedAt.getTime()+1)};return draft;}},activityLog:{create:async()=>{if(auditFails)throw Error('audit failure');count++;}}} as unknown as Prisma.TransactionClient);row=draft;logs=count;return result;}} as unknown as PrismaClient;
 return {service:createSiteSettingsManagement(db),state:()=>({row,logs,reads}),revoke:()=>{active=false;},fail:()=>{auditFails=true;}};
}
test('site settings share one public field contract and preserve unknown existing options, zero coordinates and other JSON settings',async()=>{
 const f=fixture();const page=siteSettingsPage.parse(await f.service.list('admin'));assert.equal(page.values.mapLatitude,'0');assert.equal('customOption'in page.values,false);const body={...page,values:{...page.values,siteName:'Changed',offeringBank:'Bank',offeringNumber:'123-456',offeringHolder:'Church'},confirmed:true};
 const result=await f.service.save('admin',body);assert.equal(result.saved,true);assert.equal(f.state().row.siteName,'Changed');assert.equal(f.state().row.contactOptions.customOption,'preserved');assert.deepEqual(f.state().row.socialLinks,{existing:true});assert.deepEqual(f.state().row.seoDefaults,{existing:true});assert.equal(f.state().logs,1);await assert.rejects(f.service.save('admin',body),/다른 화면/);
});
test('site settings authorization precedes reads; audit failure rolls back and missing publication confirmation is rejected',async()=>{
 const f=fixture();f.revoke();await assert.rejects(f.service.list('user'),/권한/);assert.equal(f.state().reads,0);
 const g=fixture();const page=await g.service.list('user');g.fail();await assert.rejects(g.service.save('user',{...page,confirmed:true}),/audit/);assert.equal(g.state().logs,0);assert.equal(g.state().row.updatedAt.toISOString(),page.expectedUpdatedAt);await assert.rejects(g.service.save('user',page));
});
test('settings reject executable URLs and partial offering accounts while accepting empty optional fields',async()=>{
 const f=fixture();const page=await f.service.list('user');assert.equal(siteSettingsCommand.safeParse({...page,confirmed:true}).success,true);
 for(const values of [{canonicalUrl:'javascript:alert(1)'},{youtubeUrl:'javascript:alert(1)'},{canonicalUrl:'invalid'},{offeringBank:'Bank'}])assert.equal(siteSettingsCommand.safeParse({...page,values:{...page.values,...values},confirmed:true}).success,false);
});
