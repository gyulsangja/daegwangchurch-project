import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDirectory,type Actor} from '../packages/ministry-core/src/directory';
import {createFixture} from '../packages/ministry-core/src/fixture';
import {invokeDirectory} from '../packages/ministry-core/src/directory-dispatch';
import {directoryReadPlan} from '../packages/ministry-core/src/read-plan';
import {canReadPastoralCalendar} from '../packages/ministry-core/src/calendar-access';

test('calendar checks care and church scope and returns only minimal monthly summaries',()=>{
 const service=createDirectory(createFixture(),randomUUID,()=> '2026-10-28T00:00:00Z');
 const actor:Actor={id:'test',churchId:'demo-daegwang',role:'ADMIN',organizationIds:[],permissions:['CARE']};
 const base={kind:'CARE',title:'Test visit',body:'PRIVATE BODY',date:'2026-10-20',status:'OPEN'};
 const current=service.pastoral.create(actor,base).id;
 service.pastoral.create(actor,{...base,date:'2026-11-01'});
 const annual=service.pastoral.create(actor,{...base,kind:'PLAN',date:'2026-01-01',scope:'YEAR',period:'2026'}).id;
 service.pastoral.create(actor,{...base,status:'ARCHIVED'});
 const rows=service.pastoral.calendar(actor,'2026-10');
 assert.deepEqual(new Set(rows.map(r=>r.id)),new Set([current,annual]));
 for(const row of rows)assert.deepEqual(Object.keys(row).sort(),['id','kind','title','date','status','scope','period'].sort());
 assert.ok(!JSON.stringify(rows).includes('PRIVATE BODY'));
 for(const blocked of [{...actor,permissions:[]},{...actor,role:'LEADER' as const},{...actor,churchId:'other'}]){
   assert.throws(()=>service.pastoral.calendar(blocked,'2026-10'),/FORBIDDEN/);
 }
 assert.equal(canReadPastoralCalendar({...actor,role:'LEADER'}),false);
 assert.throws(()=>service.pastoral.calendar(actor,'2026-13'));
 assert.deepEqual(invokeDirectory(service,'pastoral','calendar',[actor,'2026-10']),rows);
 assert.deepEqual(directoryReadPlan('pastoral','calendar'),['years','pastoral']);
 assert.ok(service.snapshot().state.audits.some(a=>a.action==='READ'));
});
