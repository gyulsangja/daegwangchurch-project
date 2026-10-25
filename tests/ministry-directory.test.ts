import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createDirectory, DirectoryError, type Actor } from '../packages/ministry-core/src/directory';
import { createFixture } from '../packages/ministry-core/src/fixture';
import { isLocalReviewEnabled, isLocalMutationOrigin } from '../packages/ministry-core/src/local-access';

const admin: Actor = { id: 'admin', churchId: 'demo-daegwang', role: 'ADMIN', organizationIds: [] };
const leader: Actor = { ...admin, id: 'leader', role: 'LEADER', organizationIds: ['org-youth'] };
const input = { name: '가상 등록', status: 'ACTIVE', position: '', phone: '', address: '', organizationIds: ['org-youth'] };
const make = () => createDirectory(createFixture(), randomUUID, () => '2026-10-21T00:00:00.000Z');
const code = (expected: string) => (error: unknown) => error instanceof DirectoryError && error.code === expected;

test('saved attendance roster survives member and organization changes, including unknowns',()=>{
 const d=make();const query={date:'2026-10-21',event:'School worship',organizationId:'org-youth'};
 const before=d.records.attendanceRoster(admin,query);
 assert.equal(before.savedAt,null);
 d.records.saveAttendance(admin,{...query,revision:before.revision,rows:before.rows.map(r=>({memberId:r.memberId,value:'UNKNOWN'}))});
 const saved=d.records.attendanceRoster(admin,query);assert.ok(saved.savedAt);assert.equal(saved.revision,1);
 const target=before.rows[0];const member=d.detail(admin,target.memberId);
 d.update(admin,target.memberId,{name:'Changed name',phone:'',address:'',status:'TRANSFERRED',position:member.position,organizationIds:[],version:member.version});
 const added=d.create(admin,{name:'New student',phone:'',address:'',status:'ACTIVE',position:'',organizationIds:['org-youth']});
 const after=d.records.attendanceRoster(admin,query);
 assert.deepEqual(after.rows,before.rows);
 assert.throws(()=>d.records.add(admin,added.id,{...query,kind:'ATTENDANCE',value:'PRESENT'}),code('INVALID'));
 assert.throws(()=>d.records.saveAttendance(admin,{...query,revision:0,rows:before.rows.map(r=>({memberId:r.memberId,value:'PRESENT'}))}),code('CONFLICT'));
 const restored=createDirectory(createFixture(),randomUUID,undefined,d.snapshot());
 assert.deepEqual(restored.records.attendanceRoster(admin,query).rows,before.rows);
 assert.ok(!restored.records.attendanceRoster({...admin,churchId:'demo-other'},{...query,organizationId:''}).savedAt);
});

test('care follow-up links once, respects scope, and keeps completion attached to the source',()=>{
 const d=make();const pastor={...admin,permissions:['CARE'] as ['CARE']};
 const source=d.records.add(pastor,'demo-member-1',{kind:'CARE',date:'2026-10-20',category:'VISIT',content:'Confidential original',nextDate:'2026-10-25'});
 assert.throws(()=>d.pastoral.followUp(admin,source.id),code('FORBIDDEN'));
 assert.throws(()=>d.pastoral.followUp({...pastor,churchId:'demo-other'},source.id),code('NOT_FOUND'));
 const linked=d.pastoral.followUp(pastor,source.id);
 assert.equal(d.pastoral.followUp(pastor,source.id).id,linked.id);
 const item=d.pastoral.list(pastor)[0];assert.equal(item.sourceRecordId,source.id);assert.equal(item.date,'2026-10-25');assert.equal(item.body,'');
 const update={id:item.id,version:1,kind:item.kind,title:item.title,body:'',date:item.date,memberId:item.memberId,goalId:item.goalId,category:item.category,status:'DONE',reflection:'Visit completed'};
 assert.throws(()=>d.pastoral.update(pastor,{...update,memberId:'demo-member-2'}),code('INVALID'));
 d.pastoral.update(pastor,update);
 assert.equal(d.pastoral.followUp(pastor,source.id).id,linked.id);
 assert.equal(d.pastoral.list(pastor).length,1);
 assert.equal(d.pastoral.list(pastor)[0].status,'DONE');
 const restored=createDirectory(createFixture(),randomUUID,undefined,d.snapshot());
 assert.equal(restored.pastoral.list(pastor)[0].sourceRecordId,source.id);
});

test('pastoral goals, actions and prayer history are scoped, versioned and restored',()=>{
 const d=make();const pastor={...admin,permissions:['CARE'] as ['CARE']};
 const goal={kind:'GOAL',title:'Annual care',body:'Visit each household',date:'2026-12-31',memberId:'',goalId:'',category:'OTHER',status:'OPEN'};
 assert.throws(()=>d.pastoral.list(admin),code('FORBIDDEN'));
 assert.throws(()=>d.pastoral.create(leader,goal),code('FORBIDDEN'));
 const created=d.pastoral.create(pastor,goal);
 const plan={...goal,kind:'PLAN',title:'First visit',goalId:created.id,memberId:'demo-member-1',date:'2026-10-25'};
 const action=d.pastoral.create(pastor,plan);
 assert.throws(()=>d.pastoral.create(pastor,{...plan,memberId:'other-member'}),code('NOT_FOUND'));
 assert.throws(()=>d.pastoral.update({...pastor,churchId:'demo-other'},{...plan,id:action.id,version:1}),code('NOT_FOUND'));
 assert.throws(()=>d.pastoral.update(pastor,{...plan,id:action.id,version:1,status:'DONE'}),code('INVALID'));
 d.pastoral.update(pastor,{...plan,id:action.id,version:1,status:'DONE',reflection:'Completed visit; follow up next month'});
 assert.throws(()=>d.pastoral.update(pastor,{...plan,id:action.id,version:1}),code('CONFLICT'));
 const restored=createDirectory(createFixture(),randomUUID,undefined,d.snapshot());
 const item=restored.pastoral.list(pastor).find(i=>i.id===action.id)!;
 assert.equal(item.status,'DONE');assert.equal(item.history.length,2);assert.equal(item.history[1].before?.status,'OPEN');
 assert.ok(!JSON.stringify(d.detail(admin,'demo-member-1').history).includes('Completed visit'));
 const old=d.snapshot();delete old.pastoral;
 assert.equal(createDirectory(createFixture(),randomUUID,undefined,old).pastoral.list(pastor).length,0);
});

test('attendance batches preserve unknowns, prevent stale overwrites and share individual records',()=>{
 const d=make();const query={date:'2026-10-21',event:'Sunday worship',organizationId:'org-youth'};
 assert.throws(()=>d.records.attendanceRoster(leader,query),code('FORBIDDEN'));
 assert.throws(()=>d.records.attendanceRoster(admin,{...query,organizationId:'org-other'}),code('NOT_FOUND'));
 const roster=d.records.attendanceRoster(admin,query);assert.ok(roster.rows.length>1);
 assert.ok(roster.rows.every(r=>r.value==='UNKNOWN'));
 const rows=roster.rows.map((r,i)=>({memberId:r.memberId,value:i===0?'PRESENT':'UNKNOWN'}));
 assert.throws(()=>d.records.saveAttendance(admin,{...query,revision:0,rows:[...rows,{memberId:'other-member',value:'PRESENT'}]}),code('CONFLICT'));
 assert.equal(d.records.attendanceHistory(admin).length,0);
 d.records.saveAttendance(admin,{...query,revision:0,rows});
 assert.equal(d.records.attendanceHistory(admin).length,1);
 assert.equal(d.records.list(admin,rows[0].memberId).filter(e=>e.kind==='ATTENDANCE').length,1);
 assert.throws(()=>d.records.saveAttendance(admin,{...query,revision:0,rows}),code('CONFLICT'));
 const revision=d.records.attendanceRoster(admin,query).revision;
 const changed=rows.map((r,i)=>({...r,value:i===0?'ONLINE':i===1?'ABSENT':'UNKNOWN'}));
 assert.throws(()=>d.records.saveAttendance(admin,{...query,revision,rows:changed}),code('INVALID'));
 assert.equal(d.records.attendanceHistory(admin).length,1);
 d.records.saveAttendance(admin,{...query,revision,rows:changed,reason:'Confirmed attendance'});
 assert.deepEqual(d.records.attendanceHistory(admin).map(e=>e.value).sort(),['ABSENT','ONLINE']);
 assert.ok(d.records.list(admin,rows[0].memberId).some(e=>e.voided&&e.correction?.reason==='Confirmed attendance'));
 assert.equal(d.records.attendanceHistory({...admin,churchId:'demo-other'}).length,0);
 assert.throws(()=>d.records.saveAttendance(admin,{...query,date:'2026-10-22',revision:0,rows}),code('INVALID'));
 const current=d.records.attendanceRoster(admin,query);
 d.records.saveAttendance(admin,{...query,revision:current.revision,rows:current.rows.map(r=>({memberId:r.memberId,value:'UNKNOWN'})),reason:'Wrong service'});
 assert.equal(d.records.attendanceHistory(admin).length,0);
});

test('families enforce church boundary, relation reference, one household and stale-write protection',()=>{
 const d=make();const input={name:'Example household',representativeId:'demo-member-3',members:[{memberId:'demo-member-3',relationship:'기준 교인'},{memberId:'demo-member-4',relationship:'배우자'}]};
 assert.throws(()=>d.families.create(leader,input),code('FORBIDDEN'));
 assert.throws(()=>d.families.list(leader),code('FORBIDDEN'));
 assert.throws(()=>d.families.create(admin,{...input,members:[...input.members,{memberId:'other-member',relationship:'가구원'}]}),code('NOT_FOUND'));
 assert.throws(()=>d.families.create(admin,{...input,representativeId:'demo-member-5'}),code('INVALID'));
 assert.throws(()=>d.families.create(admin,{...input,representativeId:null}),code('INVALID'));
 assert.throws(()=>d.families.create(admin,{...input,members:[...input.members,{memberId:'demo-member-1',relationship:'가구원'}]}),code('CONFLICT'));
 const family=d.families.create(admin,input);
 assert.equal(d.detail(admin,'demo-member-4').family?.id,family.id);
 assert.throws(()=>d.families.create(admin,input),code('CONFLICT'));
 d.families.update(admin,family.id,{...input,version:1,name:'Updated household'});
 assert.throws(()=>d.families.update(admin,family.id,{...input,version:1}),code('CONFLICT'));
 assert.throws(()=>d.families.archive({...admin,churchId:'demo-other'},family.id,{version:2,confirmed:true}),code('NOT_FOUND'));
 d.families.archive(admin,family.id,{version:2,confirmed:true});
 assert.equal(d.detail(admin,'demo-member-4').family,null);
 assert.equal(d.list(admin).total,14);
 assert.equal(d.families.read(admin,family.id).members.length,2);
 assert.equal(d.families.read(admin,family.id).archived,true);
 assert.equal(d.families.candidates(admin).find(m=>m.id==='demo-member-4')?.familyId,null);
 assert.ok(d.detail(admin,'demo-member-3').history.some(e=>e.fields.includes('family')));
 assert.ok(!JSON.stringify(d.detail(admin,'demo-member-3').history).includes('배우자'));
 d.families.create(admin,input);
});

test('organization roster changes are atomic, role-scoped, versioned and preserve other affiliations', () => {
  const d=make();const year=2026;const period=d.years.read(admin,year);
  const payload={version:period.version,organizationId:'org-youth',members:[{memberId:'demo-member-1',role:'LEADER'},{memberId:'demo-member-2',role:'TREASURER'}]};
  assert.throws(()=>d.years.roster(admin,year,{...payload,members:[...payload.members,{memberId:'other-member',role:''}]}),code('NOT_FOUND'));
  assert.deepEqual(d.years.read(admin,year),period);
  assert.throws(()=>d.years.roster(admin,year,{...payload,members:[{memberId:'demo-member-1',role:'TEACHER'}]}),code('INVALID'));
  assert.deepEqual(d.years.read(admin,year),period);
  d.years.roster(admin,year,payload);
  assert.ok(d.detail(admin,'demo-member-1').organizationIds.includes('org-service'));
  assert.ok(d.detail(admin,'demo-member-2').organizationIds.includes('org-adults'));
  assert.equal(d.detail(admin,'demo-member-1').position,'MEMBER');
  assert.equal(d.list(admin,{organizationId:'org-youth'}).total,2);
  assert.throws(()=>d.years.roster(admin,year,payload),code('CONFLICT'));
  assert.throws(()=>d.years.roster(leader,year,payload),code('FORBIDDEN'));
  const current=d.years.read(admin,year);
  const {name,positions,statuses,organizationTypes,roles,courses,organizations,version}=current;
  assert.throws(()=>d.years.configure(admin,year,{name,positions,statuses,organizationTypes,roles,courses,version,organizations:organizations.map(o=>o.id==='org-youth'?{...o,roleCodes:['SECRETARY']}:o)}),code('INVALID'));
  assert.equal(d.years.read(admin,year).version,current.version);
  d.years.create(admin,{year:2027,sourceYear:2026,sourceVersion:current.version,copyMembers:true,copyRoles:true});
  d.years.roster(admin,2027,{...payload,version:d.years.read(admin,2027).version,members:[]});
  assert.equal(d.list(admin,{organizationId:'org-youth'}).total,2);
});

test('education validates completion dates, preserves corrections and separates repeat cohorts', () => {
  const d=make(); const m='demo-member-1';
  const input={kind:'EDUCATION',courseId:'NEWCOMER',cohort:'2026 spring',date:'2026-03-01',value:'IN_PROGRESS',endDate:null,teacher:'Example teacher'};
  const saved=d.records.add(admin,m,input);
  assert.throws(()=>d.records.add(admin,m,input),code('CONFLICT'));
  assert.throws(()=>d.records.add(admin,m,{...input,value:'COMPLETED'}),code('INVALID'));
  assert.throws(()=>d.records.add(admin,m,{...input,value:'COMPLETED',endDate:'2026-02-01'}),code('INVALID'));
  assert.throws(()=>d.records.add(admin,m,{...input,value:'COMPLETED',endDate:'2027-01-01'}),code('INVALID'));
  assert.throws(()=>d.records.add(admin,m,{...input,courseId:'unknown'}),code('INVALID'));
  d.records.correct(admin,m,saved.id,'Record completion');
  d.records.add(admin,m,{...input,value:'COMPLETED',endDate:'2026-04-01'});
  d.records.add(admin,m,{...input,cohort:'2026 autumn',date:'2026-09-01'});
  const history=d.records.list(admin,m);
  assert.equal(history.length,3); assert.equal(history.filter(e=>e.voided).length,1);
  assert.equal(d.detail(admin,m).status,'ACTIVE');assert.equal(d.detail(admin,m).position,'MEMBER');
  assert.throws(()=>d.records.add(leader,m,input),code('FORBIDDEN'));
  assert.throws(()=>d.records.add(admin,'other-member',input),code('NOT_FOUND'));
  const period=d.years.read(admin,2026);
  d.years.create(admin,{year:2027,sourceYear:2026,sourceVersion:period.version,copyMembers:true,copyRoles:true});
  assert.deepEqual(d.years.read(admin,2027).courses,period.courses);
});

test('every read is church scoped; leader can only read assigned organizations and no private profile', () => {
  const directory = make();
  assert.equal(directory.list(admin).total, 14);
  assert.equal(directory.list({ ...admin, churchId: 'demo-other' }).total, 1);
  assert.throws(() => directory.detail(admin, 'other-member'), code('NOT_FOUND'));
  assert.throws(() => directory.list({ ...admin, churchId: 'unknown' }), code('FORBIDDEN'));
  const members = directory.list(leader).items;
  assert.ok(members.length > 0);
  assert.ok(members.every(m => m.organizationIds.includes('org-youth')));
  const detail = directory.detail(leader, members[0].id);
  assert.equal(detail.privateProfile, null); assert.equal(detail.family, null); assert.deepEqual(detail.history, []);
  assert.ok(!JSON.stringify(directory.list(admin)).includes('phone'));
  assert.throws(() => directory.detail(leader, 'demo-member-2'), code('NOT_FOUND'));
});
test('write rejects other church links, leader, forged identity, unknown codes, duplicate affiliations', () => {
  const directory = make();
  assert.throws(() => directory.create(leader, input), code('FORBIDDEN'));
  for (const changed of [{ organizationIds: ['org-other'] }, { organizationIds: ['org-youth', 'org-youth'] }, { status: 'FAKE' }, { position: 'FAKE' }]) assert.throws(() => directory.create(admin, { ...input, ...changed }), code('INVALID'));
  assert.throws(() => directory.create(admin, { ...input, churchId: 'demo-other' }));
  assert.throws(() => directory.create(admin, { ...input, actorId: 'other' }));
  assert.equal(directory.list(admin).total, 14);
  assert.throws(() => directory.update(admin, 'other-member', { ...input, version: 1 }), code('NOT_FOUND'));
});
test('same names remain distinct; stale update cannot overwrite; audit contains field names only', () => {
  const directory = make(); const one = directory.create(admin, input); const two = directory.create(admin, input);
  assert.notEqual(one.id, two.id);
  assert.equal(directory.list(admin, { q: input.name }).total, 2);
  directory.update(admin, one.id, { ...input, name: '가상 수정', phone: '000-0000-0000', version: 1 });
  assert.throws(() => directory.update(admin, one.id, { ...input, version: 1 }), code('CONFLICT'));
  const detail = directory.detail(admin, one.id);
  assert.equal(detail.name, '가상 수정'); assert.equal(detail.version, 2);
  assert.deepEqual(detail.history[0].fields, ['name', 'phone']);
  assert.ok(!JSON.stringify(detail.history).includes('000-0000'));
});
test('filters and pagination are stable and returned arrays cannot mutate stored data', () => {
  const directory = make(); const first = directory.list(admin); const second = directory.list(admin, { page: 2 });
  assert.equal(first.items.length, 12); assert.equal(second.items.length, 2);
  assert.equal(new Set([...first.items, ...second.items].map(m => m.id)).size, 14);
  assert.equal(directory.list(admin, { status: 'ACTIVE' }).total, 14);
  const config = directory.config(admin); config.organizations[0].name = 'changed';
  first.items[0].organizationIds.push('org-other');
  assert.notEqual(directory.config(admin).organizations[0].name, 'changed');
  assert.ok(directory.list(admin).items.every(m => !m.organizationIds.includes('org-other')));
});
test('local review cannot be enabled in production or from an outside host/origin', () => {
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'production', MINISTRY_LOCAL_DEMO: 'true' }, 'localhost:3002'), false);
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'development' }, 'localhost:3002'), false);
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'development', MINISTRY_LOCAL_DEMO: 'true' }, 'evil.example:3002'), false);
  assert.equal(isLocalReviewEnabled({ NODE_ENV: 'development', MINISTRY_LOCAL_DEMO: 'true' }, 'localhost:3002'), true);
  assert.equal(isLocalMutationOrigin('localhost:3002', 'https://evil.example'), false);
  assert.equal(isLocalMutationOrigin('localhost:3002', null), false);
  assert.equal(isLocalMutationOrigin('localhost:3002', 'http://localhost:3002'), true);
});

test('annual draft isolation, roles, activation, immutable old year and stale leader scope', () => {
  const d = make(); const original = d.years.read(admin,2026);
  d.years.create(admin,{year:2027,sourceYear:2026,sourceVersion:original.version,copyMembers:true,copyRoles:false});
  let draft = d.years.read(admin,2027);
  d.years.assign(admin,2027,{version:draft.version,memberId:'demo-member-1',position:'ELDER',affiliations:[{organizationId:'org-youth',role:'LEADER'},{organizationId:'org-service',role:'VOLUNTEER'}]});
  assert.equal(d.detail(admin,'demo-member-1').position,'MEMBER');
  draft = d.years.read(admin,2027);
  d.years.activate(admin,2027,{version:draft.version,activeVersion:original.version,confirmed:true});
  assert.equal(d.detail(admin,'demo-member-1').position,'ELDER');
  assert.equal(d.years.read(admin,2026).assignments[0].position,'MEMBER');
  assert.equal(d.list(leader).total,0);
  assert.throws(() => d.years.assign(admin,2026,{version:d.years.read(admin,2026).version,memberId:'demo-member-1',position:'DEACON',affiliations:[]}),code('CONFLICT'));
  assert.equal(d.records.list(admin,'demo-member-1').filter(e=>e.kind==='POSITION').length,1);
});

test('year catalogs reject cycles, in-use deletion, other church links and stale versions', () => {
  const d=make(); const period=d.years.read(admin,2026);
  const {name,positions,statuses,organizationTypes,roles,organizations,version}=period;
  const config={name,positions,statuses,organizationTypes,roles,organizations,version};
  assert.throws(()=>d.years.configure(admin,2026,{...config,organizations:organizations.map((o,i)=>i===0?{...o,parentId:o.id}:o)}),code('INVALID'));
  assert.throws(()=>d.years.configure(admin,2026,{...config,positions:[]}),code('INVALID'));
  assert.throws(()=>d.years.assign(admin,2026,{version,memberId:'other-member',position:'',affiliations:[]}),code('NOT_FOUND'));
  assert.throws(()=>d.years.configure(leader,2026,config),code('FORBIDDEN'));
  d.years.configure(admin,2026,config);
  assert.throws(()=>d.years.configure(admin,2026,config),code('CONFLICT'));
});

test('dated position and membership changes preserve earlier history; newcomer is independent', () => {
  const d=make(); const m='demo-member-1';
  d.records.add(admin,m,{kind:'POSITION',date:'2025-03-01',value:'ELDER'});
  d.records.add(admin,m,{kind:'POSITION',date:'2020-03-01',value:'DEACON'});
  assert.equal(d.detail(admin,m).position,'ELDER');
  d.records.add(admin,m,{kind:'SETTLEMENT',date:'2026-10-01',value:'NEW'});
  assert.equal(d.detail(admin,m).status,'ACTIVE');
  d.records.add(admin,m,{kind:'STATUS',date:'2026-10-02',value:'TRANSFERRED'});
  assert.equal(d.detail(admin,m).status,'TRANSFERRED');
  assert.equal(d.records.list(admin,m).length,4);
  assert.throws(()=>d.records.add(admin,m,{kind:'POSITION',date:'2025-02-30',value:'ELDER'}));
  assert.throws(()=>d.records.add(admin,m,{kind:'POSITION',date:'2028-01-01',value:'ELDER'}),code('INVALID'));
  assert.throws(()=>d.records.add(leader,m,{kind:'POSITION',date:'2025-01-01',value:'ELDER'}),code('FORBIDDEN'));
});

test('care needs explicit permission; attendance duplicates and service overlaps require audited correction', () => {
  const d=make(); const m='demo-member-1'; const counselor:Actor={...admin,permissions:['CARE']};
  const care={kind:'CARE',date:'2026-10-20',category:'COUNSEL',content:'synthetic confidential note',nextDate:null};
  assert.throws(()=>d.records.add(admin,m,care),code('FORBIDDEN'));
  const saved=d.records.add(counselor,m,care);
  assert.equal(d.records.list(admin,m).length,0);
  assert.equal(d.records.list(counselor,m).length,1);
  assert.ok(!JSON.stringify(d.detail(admin,m)).includes(care.content));
  assert.throws(()=>d.records.correct(admin,m,saved.id,'wrong record'),code('FORBIDDEN'));
  const attendance={kind:'ATTENDANCE',date:'2026-10-18',organizationId:'',event:'Sunday service',value:'PRESENT'};
  const a=d.records.add(admin,m,attendance);
  assert.throws(()=>d.records.add(admin,m,attendance),code('CONFLICT'));
  d.records.correct(admin,m,a.id,'entered by mistake');
  d.records.add(admin,m,{...attendance,value:'ONLINE'});
  const activity={kind:'SERVICE',date:'2026-01-01',organizationId:'org-service',role:'VOLUNTEER',endDate:null};
  const service=d.records.add(admin,m,activity);
  assert.throws(()=>d.records.add(admin,m,activity),code('CONFLICT'));
  d.records.correct(admin,m,service.id,'add end date');
  d.records.add(admin,m,{...activity,endDate:'2026-06-30'});
  d.records.add(admin,m,{...activity,date:'2026-07-01'});
  assert.throws(()=>d.records.add(admin,'other-member',attendance),code('NOT_FOUND'));
});
