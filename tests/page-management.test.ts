import test from 'node:test';import assert from 'node:assert/strict';
import type {PrismaClient,Prisma} from '@daegwang/database/generated/client';
import {fixedPageKind,fixedPageCommand,fixedPageContent,pageEditorValues,fixedPageInfo} from '../packages/contracts/src/page-management';
import {createFixedPageManagement} from '../packages/server/src/features/church-content/page-management';
test('all fixed-page editors round-trip their public content and retain legacy home fields',()=>{
 for(const kind of fixedPageKind.options){const values=pageEditorValues(kind,null,'DRAFT');const input=fixedPageCommand.parse({kind,values,expectedUpdatedAt:null,confirmed:false});const built=fixedPageContent(input);assert.deepEqual(pageEditorValues(kind,built.content as Parameters<typeof pageEditorValues>[1],'DRAFT'),values);assert.equal(fixedPageCommand.safeParse({...input,values:{...values,status:'PUBLISHED'}}).success,false);assert.equal(fixedPageCommand.safeParse({...input,values:{...values,status:'PUBLISHED'},confirmed:true}).success,true);}
 const home=pageEditorValues('home',null,'DRAFT');assert.equal(typeof home.worshipTitle,'string');assert.equal(typeof home.showWorship,'boolean');
});
function fixture(){let active=true,fail=false,reads=0;let row={id:'original',key:fixedPageInfo.church.key,content:{...fixedPageContent(fixedPageCommand.parse({kind:'church',values:pageEditorValues('church',null,'DRAFT'),expectedUpdatedAt:null,confirmed:false})).content,extension:'preserved'},status:'DRAFT',updatedAt:new Date('2026-10-29T00:00:00Z'),publishedAt:null as Date|null,deletedAt:null};let logs=0;
 const db={$transaction:async<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>)=>{let next=structuredClone(row),count=logs;const result=await work({adminProfile:{findUnique:async()=>({id:'admin',isActive:active})},$executeRaw:async()=>0,page:{findUnique:async()=>{reads++;return next;},upsert:async({update}:{update:object})=>{next={...next,...update,updatedAt:new Date(next.updatedAt.getTime()+1)};return next;}},activityLog:{create:async()=>{if(fail)throw Error('audit failure');count++;}}} as unknown as Prisma.TransactionClient);row=next;logs=count;return result;}} as unknown as PrismaClient;
 return {service:createFixedPageManagement(db),state:()=>({row,logs,reads}),revoke:()=>{active=false;},fail:()=>{fail=true;}};
}
test('fixed page management shares original identity, preserves extension fields and rejects stale overwrites',async()=>{
 const f=fixture();const page=await f.service.list('user',{kind:'church'});assert.equal('extension'in page.values,false);const input={...page,values:{...page.values,heroTitle:'Changed',status:'PUBLISHED'},confirmed:true};await f.service.save('user',input);assert.equal(f.state().row.id,'original');assert.equal(f.state().row.key,'ABOUT_CHURCH');assert.equal(f.state().row.content.extension,'preserved');assert.ok(f.state().row.publishedAt);assert.equal(f.state().logs,1);await assert.rejects(f.service.save('user',input),/다른 화면/);
});
test('fixed-page read authorization and audit failure cannot expose or partially update the original',async()=>{
 const f=fixture();f.revoke();await assert.rejects(f.service.list('user',{kind:'church'}),/권한/);assert.equal(f.state().reads,0);const g=fixture();const page=await g.service.list('user',{kind:'church'});g.fail();await assert.rejects(g.service.save('user',{...page,confirmed:true,values:{...page.values,status:'PUBLISHED'}}),/audit/);assert.equal(g.state().row.status,'DRAFT');assert.equal(g.state().logs,0);
});
