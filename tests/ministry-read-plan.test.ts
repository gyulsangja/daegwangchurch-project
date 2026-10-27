import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createDirectory,type Actor,type DirectorySnapshot} from '../packages/ministry-core/src/directory';
import {createFixture} from '../packages/ministry-core/src/fixture';
import {directoryReadPlan} from '../packages/ministry-core/src/read-plan';
import {invokeDirectory} from '../packages/ministry-core/src/directory-dispatch';
const actor:Actor={id:'test',churchId:'demo-daegwang',role:'ADMIN',organizationIds:[],permissions:['CARE']};
const now=()=> '2026-10-27T00:00:00.000Z';
test('selective reads preserve results, access boundaries and new audits without domain mutations',()=>{
 const seed=createDirectory(createFixture(),randomUUID,now);
 seed.records.add(actor,'demo-member-1',{kind:'CARE',date:'2026-10-20',category:'VISIT',content:'Test care',nextDate:'2026-10-25'});
 seed.pastoral.create(actor,{kind:'PRAYER',title:'Test prayer',body:'',date:'2026-10-25',memberId:'demo-member-1',goalId:'',category:'OTHER',status:'OPEN'});
 const saved=seed.snapshot();
 const cases:[string|undefined,string,unknown[]][]=[
  [undefined,'config',[]],[undefined,'list',[{q:''}]],[undefined,'options',[]],[undefined,'overview',[]],[undefined,'detail',['demo-member-1']],
  ['years','list',[]],['years','targets',[]],['years','read',[2026]],['years','memberHistory',['demo-member-1']],
  ['families','list',[]],['families','candidates',[]],['families','read',[saved.state.families[0].id]],
  ['pastoral','list',[]],['records','workspace',['CARE']],['records','careHistory',[]],['records','list',['demo-member-1']],
  ['records','attendanceHistory',[]],['records','attendanceRoster',[{date:'2026-10-25',event:'주일예배',organizationId:''}]],
 ];
 const roles:Actor[]=[actor,{...actor,permissions:[]},{...actor,role:'LEADER',scopeYear:2026,organizationIds:['org-youth']},{...actor,churchId:'missing'}];
 for(const [group,method,args] of cases)for(const current of roles){
  const plan=directoryReadPlan(group,method);assert.ok(plan);
  const partial=structuredClone(saved);
  for(const k of ['members','organizations','families','audits'] as const)if(!plan.includes(k))partial.state[k]=[];
  for(const [key,table] of [['records','records'],['pastoral','pastoral'],['attendanceSessions','attendance_sessions']] as const)if(!plan.includes(table))partial[key]=[];
  const run=(s:DirectorySnapshot)=>{
   let counter=0;const domain=createDirectory(s.state,()=>`audit-${++counter}`,now,s);
   try{return {result:invokeDirectory(domain,group,method,[current,...args]),after:domain.snapshot()};}
   catch(e){return {error:e instanceof Error?e.message:String(e)};}
  };
  const full=run(saved),reduced=run(partial);const label=`${group??'root'}.${method}/${current.role}/${current.churchId}`;
  assert.deepEqual(reduced.result,full.result,label);assert.equal(reduced.error,full.error,label);
  if(reduced.after&&full.after){
   assert.deepEqual(reduced.after.state.audits.slice(partial.state.audits.length),full.after.state.audits.slice(saved.state.audits.length),label+' audits');
   reduced.after.state.audits=partial.state.audits;assert.deepEqual(reduced.after,partial,label+' read must not mutate domain');
  }
 }
 for(const [group,method] of [[undefined,'create'],[undefined,'update'],['years','roster'],['records','batch'],['records','saveAttendance'],['pastoral','update'],['families','link'],['future','unknown']] as const)assert.equal(directoryReadPlan(group,method),undefined);
});
