import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {withMinistrySnapshot,backupMinistryLocal,MinistryStorageError} from '../packages/database/src/ministry-local';
import {createDirectory,type DirectorySnapshot,type Actor} from '../packages/ministry-core/src/directory';
import {createFixture} from '../packages/ministry-core/src/fixture';
function cleanTemporary(folder:string){const target=resolve(folder);assert.ok(target.startsWith(resolve(tmpdir())+sep)&&basename(target).startsWith('ministry-'));rmSync(target,{recursive:true,force:true});}
const actor:Actor={id:'storage-test',churchId:'demo-daegwang',role:'ADMIN',organizationIds:[],permissions:['CARE']};
const initial=()=>createDirectory(createFixture(),randomUUID).snapshot();
function invoke<T>(path:string,fn:(service:ReturnType<typeof createDirectory>)=>T){return withMinistrySnapshot(path,initial,raw=>{const snapshot=raw as DirectorySnapshot;const service=createDirectory(snapshot.state,randomUUID,undefined,snapshot);const result=fn(service);return {snapshot:service.snapshot(),result};});}
test('local SQLite persists complete domain state across connections and a separate process, including backup',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'ministry-store-'));const path=join(folder,'review.sqlite');
 try{
   const created=invoke(path,s=>s.create(actor,{name:'가상 저장 검증',status:'ACTIVE',position:'',phone:'',address:'',organizationIds:[]}));
   invoke(path,s=>s.families.create(actor,{name:'가상 저장 가구',representativeId:null,members:[{memberId:created.id,relationship:'가구원'}]}));
   const prayer=invoke(path,s=>s.pastoral.create(actor,{kind:'PRAYER',title:'Synthetic prayer',body:'Private pastoral note',date:'2026-10-24',memberId:created.id,goalId:'',category:'OTHER',status:'OPEN'}));
   assert.equal(invoke(path,s=>s.pastoral.list(actor).find(i=>i.id===prayer.id)?.body),'Private pastoral note');
   invoke(path,s=>{const year=s.config(actor).activeYear;const source=s.years.read(actor,year);s.years.create(actor,{year:year+1,sourceYear:year,sourceVersion:source.version,copyMembers:true,copyRoles:true});s.records.add(actor,created.id,{kind:'CARE',date:'2026-10-01',category:'COUNSEL',content:'synthetic storage test',nextDate:null});});
   invoke(path,s=>{assert.equal(s.detail(actor,created.id).family?.name,'가상 저장 가구');assert.equal(s.records.list(actor,created.id).length,1);assert.equal(s.years.list(actor).length,2);assert.equal(s.records.list({...actor,permissions:[]},created.id).length,0);});
   const code=`import {DatabaseSync} from 'node:sqlite';const db=new DatabaseSync(${JSON.stringify(path)},{readOnly:true});const row=db.prepare('SELECT payload FROM ministry_review_snapshot WHERE id=1').get();console.log(JSON.parse(row.payload).state.members.length);db.close();`;
   assert.equal(execFileSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'}).trim(),'16');
   const destination=join(folder,'backup.sqlite');await backupMinistryLocal(path,destination);
   assert.equal(invoke(destination,s=>s.detail(actor,created.id).name),'가상 저장 검증');
 }finally{cleanTemporary(folder);}
});
test('failed writes roll back the entire mutation and a corrupt store never silently reseeds',()=>{
 const folder=mkdtempSync(join(tmpdir(),'ministry-rollback-'));const path=join(folder,'review.sqlite');
 try{
  invoke(path,s=>s.list(actor));
  assert.throws(()=>invoke(path,s=>{s.create(actor,{name:'must roll back',status:'ACTIVE',position:'',phone:'',address:'',organizationIds:[]});throw new Error('simulated save failure');}));
  assert.equal(invoke(path,s=>s.list(actor).total),14);
  const db=new DatabaseSync(path);db.exec("UPDATE ministry_review_snapshot SET payload='corrupt' WHERE id=1");db.close();
  assert.throws(()=>invoke(path,s=>s.list(actor)),MinistryStorageError);
  const inspect=new DatabaseSync(path,{readOnly:true});assert.equal(inspect.prepare('SELECT payload FROM ministry_review_snapshot').get()?.payload,'corrupt');inspect.close();
 }finally{cleanTemporary(folder);}
});
test('independent storage connections retain version conflict checks and reject other church writes',()=>{
 const folder=mkdtempSync(join(tmpdir(),'ministry-conflict-'));const path=join(folder,'review.sqlite');
 try{
  const member=invoke(path,s=>s.detail(actor,'demo-member-3'));
  const input={name:member.name,status:member.status,position:member.position,phone:'',address:'',organizationIds:member.organizationIds,version:member.version};
  invoke(path,s=>s.update(actor,member.id,{...input,name:'stored name'}));
  assert.throws(()=>invoke(path,s=>s.update(actor,member.id,input)),error=>error instanceof Error&&'code' in error&&error.code==='CONFLICT');
  assert.throws(()=>invoke(path,s=>s.update({...actor,churchId:'demo-other'},member.id,input)));
  assert.equal(invoke(path,s=>s.detail(actor,member.id).name),'stored name');
 }finally{cleanTemporary(folder);}
});
