import 'server-only';
import {Pool} from 'pg';
import {randomUUID,createHash} from 'node:crypto';
import {createDirectory,type DirectorySnapshot,type Actor} from '@daegwang/ministry-core/directory';
import {asyncDirectory} from '@daegwang/ministry-core/async-directory';
import {invokeDirectory} from '@daegwang/ministry-core/directory-dispatch';
import {directoryReadPlan} from '@daegwang/ministry-core/read-plan';
import {ministryTransaction,readMinistryRows,writeMinistryRows,appendMinistryAudits,type MinistryRows,type MinistryTable} from '@daegwang/database/ministry-postgres';
let pool:Pool|undefined;
export function ministryPool(){
 if(!process.env.MINISTRY_DATABASE_URL)throw new Error('MINISTRY_NOT_CONFIGURED');
 return pool??=new Pool({connectionString:process.env.MINISTRY_DATABASE_URL,max:2,connectionTimeoutMillis:10000,idleTimeoutMillis:10000});
}
export function snapshot(rows:MinistryRows):DirectorySnapshot{
 const payload=(key:Exclude<keyof MinistryRows,'church'>)=>rows[key].map(r=>r.payload);
 return {schemaVersion:1,state:{churches:[rows.church],members:payload('members'),organizations:payload('organizations'),families:payload('families'),audits:payload('audits')},years:payload('years'),records:payload('records'),pastoral:payload('pastoral'),attendanceSessions:payload('attendance_sessions')} as DirectorySnapshot;
}
export function rows(snapshot:DirectorySnapshot):MinistryRows{
 const entities=(values:{id:string}[])=>values.map(v=>({id:v.id,payload:v}));
 return {church:snapshot.state.churches[0],members:entities(snapshot.state.members),organizations:entities(snapshot.state.organizations),families:entities(snapshot.state.families),audits:entities(snapshot.state.audits),records:entities(snapshot.records),pastoral:entities(snapshot.pastoral??[]),years:snapshot.years.map(v=>({id:String(v.year),payload:v})),attendance_sessions:(snapshot.attendanceSessions??[]).map(v=>({id:createHash('sha256').update(JSON.stringify([v.date,v.event,v.organizationId])).digest('hex'),payload:v}))};
}
export async function operationalDirectory(userId:string,churchId:string,aal='aal1'){
 const security={aal,enforceMfa:false};
 const actor=await ministryTransaction(ministryPool(),userId,churchId,async(_db,grant):Promise<Actor>=>({id:userId,churchId,role:grant.role,organizationIds:grant.organizationIds,scopeYear:grant.scopeYear,canPrint:grant.canPrint,canDelete:grant.canDelete,permissions:grant.care?['CARE']:[]}),{...security,readOnly:true});
 const service=asyncDirectory(async(group,method,args)=>{
  if(['snapshot','sessionSnapshot','capture','syncMember','activeYear'].includes(method))throw new Error('INTERNAL_METHOD');
  const readPlan=directoryReadPlan(group,method) as readonly MinistryTable[]|undefined;
  return ministryTransaction(ministryPool(),userId,churchId,async(db,grant)=>{
   const before=await readMinistryRows(db,churchId,readPlan);const saved=snapshot(before);
   if(saved.years.length===0)throw new Error('MINISTRY_NOT_INITIALIZED');
   const domain=createDirectory(saved.state,randomUUID,undefined,saved);
   const current:Actor={...actor,role:grant.role,organizationIds:grant.organizationIds,scopeYear:grant.scopeYear,canPrint:grant.canPrint,canDelete:grant.canDelete,permissions:grant.care?['CARE']:[]};
   if(current.role==='LEADER'&&current.scopeYear!==domain.config(current).activeYear)throw new Error('MINISTRY_ACCESS_DENIED');
   const result=invokeDirectory(domain,group,method,[current,...args.slice(1)]);
   if(readPlan){
    // Reads may append a required access audit, but never rewrite domain rows.
    const added=domain.snapshot().state.audits.slice(before.audits.length);
    await appendMinistryAudits(db,churchId,added.map(a=>({id:a.id,payload:a})));
   }else await writeMinistryRows(db,churchId,before,rows(domain.snapshot()));
   return result;
  },{...security,readOnly:!!readPlan});
 });
 return {service,actor};
}
