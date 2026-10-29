import test from 'node:test';import assert from 'node:assert/strict';
import type {Prisma,PrismaClient} from '@daegwang/database/generated/client';
import {createGuideManagement} from '../packages/server/src/features/church-content/guide-management';
import {guideSave,emptyGuideValues,type GuideKind} from '../packages/contracts/src/guide-management';
const id='11111111-1111-4111-8111-111111111111';
function fixture(){type Row=Record<string,unknown>;let state:Record<string,Row>={},logs:unknown[]=[];let active=true,failAudit=false;
 const db={async $transaction<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>){const draft=structuredClone(state),audit=structuredClone(logs);const model=(name:string)=>({findFirst:async({where}:{where:{id:string}})=>draft[name]?.id===where.id&&!draft[name].deletedAt?draft[name]:null,findMany:async()=>draft[name]?[draft[name]]:[],create:async({data}:{data:Row})=>{draft[name]={createdAt:new Date(),updatedAt:new Date('2026-10-30T00:00:00Z'),deletedAt:null,...data};},updateMany:async({where,data}:{where:{updatedAt:Date};data:Row})=>{if((draft[name].updatedAt as Date).getTime()!==where.updatedAt.getTime())return {count:0};Object.assign(draft[name],data,{updatedAt:new Date(where.updatedAt.getTime()+1)});return {count:1};}});
 const result=await work({adminProfile:{findUnique:async()=>({id:'admin',role:'ADMIN',isActive:active})},person:model('PEOPLE'),ministry:model('MINISTRIES'),worshipSchedule:model('SCHEDULES'),historyItem:model('HISTORY'),media:{findFirst:async()=>null},activityLog:{create:async(data:unknown)=>{if(failAudit)throw Error('AUDIT_FAILED');audit.push(data);}}} as unknown as Prisma.TransactionClient);state=draft;logs=audit;return result;}} as unknown as Pick<PrismaClient,'$transaction'>;
 return {service:createGuideManagement(db,'https://example.invalid'),read:()=>state,revoke:()=>{active=false;},failAudit:()=>{failAudit=true;}};
}
test('four guide types round-trip existing public structure and reject stale writes',async()=>{
 const samples:Record<GuideKind,Record<string,unknown>>={PEOPLE:{name:'검토 성도',position:'장로',careerText:'첫째\n둘째'},MINISTRIES:{name:'청년부',introduction:'함께 예배합니다.',programText:'예배\n교제'},SCHEDULES:{name:'주일예배',dayLabel:'매주 주일',timeLabel:'오전 11:00'},HISTORY:{year:2024,month:'2',day:'29',title:'교회 소식'}};
 for(const kind of Object.keys(samples) as GuideKind[]){const f=fixture(),input={operation:'SAVE',kind,id,expectedUpdatedAt:null,imageId:null,publishConfirmed:false,data:{...emptyGuideValues(kind,id),...samples[kind]}};await f.service.save('admin',input);const detail=await f.service.list('admin',{kind,id});assert.ok(!Array.isArray(detail.data));assert.equal(detail.data.id,id);assert.ok(guideSave.safeParse({...input,data:detail.data.values}).success);await assert.rejects(f.service.save('admin',input),/이미 저장/);
  await f.service.save('admin',{...input,expectedUpdatedAt:detail.data.updatedAt,data:{...detail.data.values,...(kind==='MINISTRIES'?{slug:'different-slug'}:{})}});if(kind==='MINISTRIES')assert.equal(f.read()[kind].slug,`ministry-${id.slice(0,8)}`);
  await assert.rejects(f.service.save('admin',{...input,expectedUpdatedAt:detail.data.updatedAt}),/다른 화면/);
 }
});
test('guide access, actual calendar dates, image eligibility and audit rollback are enforced',async()=>{
 const f=fixture(),input={operation:'SAVE',kind:'HISTORY',id,expectedUpdatedAt:null,imageId:null,publishConfirmed:false,data:{...emptyGuideValues('HISTORY',id),year:2025,month:'2',day:'29',title:'Test'}};
 assert.equal(guideSave.safeParse(input).success,false);assert.equal(guideSave.safeParse({...input,data:{...input.data,month:'',day:'1'}}).success,false);
 const valid={...input,data:{...input.data,day:'28'}};f.failAudit();await assert.rejects(f.service.save('admin',valid),/AUDIT/);assert.deepEqual(f.read(),{});f.revoke();await assert.rejects(f.service.list('admin',{kind:'HISTORY'}),/권한/);
 const g=fixture();await assert.rejects(g.service.save('admin',{operation:'SAVE',kind:'PEOPLE',id,expectedUpdatedAt:null,imageId:'unverified',publishConfirmed:false,data:{...emptyGuideValues('PEOPLE',id),name:'Test',position:'Test'}}),/이미지/);assert.deepEqual(g.read(),{});
});
