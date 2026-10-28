import 'server-only';
import {authenticatedSession} from './auth-security';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {createDirectory,DirectoryError,type Actor} from '@daegwang/ministry-core/directory';
import {recordDate} from '@daegwang/contracts/ministry-records';
import {ministryTransaction,readMinistryRows,writeMinistryRows,MinistryAccessError} from '@daegwang/database/ministry-postgres';
import {ministryPool,snapshot,rows} from './operational-directory';
import {readCmsInbox,bridgeEnabled} from './cms-bridge';
import {operationalEnabled} from './operational-config';
export async function integrationInbox(actor:Actor){
 if(!operationalEnabled()||!bridgeEnabled())return {configured:false,accounts:[],care:[],links:[],intakes:[]};
 if(actor.role!=='ADMIN')throw new MinistryAccessError();
 const {aal}=await authenticatedSession();const source=await readCmsInbox(actor.id,!!actor.permissions?.includes('CARE'));
 return ministryTransaction(ministryPool(),actor.id,actor.churchId,async(db,grant)=>{
  if(grant.role!=='ADMIN')throw new MinistryAccessError();
  const links=(await db.query('SELECT member_id,user_id FROM ministry.account_links WHERE church_id=$1',[actor.churchId])).rows as {member_id:string;user_id:string}[];
  const intakes=grant.care?(await db.query('SELECT source_id,pastoral_id FROM ministry.care_intakes WHERE church_id=$1',[actor.churchId])).rows as {source_id:string;pastoral_id:string}[]:[];
  const auditId=randomUUID();await db.query('INSERT INTO ministry.audits(church_id,id,payload) VALUES($1,$2,$3)',[actor.churchId,auditId,{id:auditId,churchId:actor.churchId,actorId:actor.id,memberId:'',action:'READ',fields:['integrationInbox'],at:new Date().toISOString()}]);
  return {...source,care:grant.care?source.care:[],links,intakes};
 },{aal,enforceMfa:false});
}
const command=z.discriminatedUnion('action',[
 z.object({action:z.literal('LINK'),userId:z.uuid(),memberId:z.string().min(1).max(100),sourceVersion:z.number().int().positive(),memberVersion:z.number().int().positive(),confirmed:z.literal(true)}).strict(),
 z.object({action:z.literal('INTAKE'),sourceId:z.string().min(1).max(100),sourceVersion:z.number().int().positive(),date:recordDate,confirmed:z.literal(true)}).strict(),
]);
export async function applyIntegration(actor:Actor,raw:unknown){
 if(!operationalEnabled()||!bridgeEnabled()||actor.role!=='ADMIN')throw new MinistryAccessError();
 const input=command.parse(raw);const {aal}=await authenticatedSession();const source=await readCmsInbox(actor.id,input.action==='INTAKE'&&!!actor.permissions?.includes('CARE'));
 return ministryTransaction(ministryPool(),actor.id,actor.churchId,async(db,grant)=>{
  if(grant.role!=='ADMIN')throw new MinistryAccessError();
  const before=await readMinistryRows(db,actor.churchId);const saved=snapshot(before);const current={...actor,permissions:grant.care?['CARE' as const]:[]};const domain=createDirectory(saved.state,randomUUID,undefined,saved);
  let result:{id:string};
  if(input.action==='LINK'){
   const account=source.accounts.find(a=>a.ownerId===input.userId&&a.version===input.sourceVersion);if(!account)throw new DirectoryError('CONFLICT','회원 정보가 변경되었습니다. 다시 확인해 주세요.');
   const member=domain.detail(current,input.memberId);if(member.version!==input.memberVersion)throw new DirectoryError('CONFLICT');
   const old=(await db.query('SELECT user_id,member_id FROM ministry.account_links WHERE church_id=$1 AND (user_id=$2 OR member_id=$3)',[actor.churchId,input.userId,input.memberId])).rows;
   if(old.length){if(old.length===1&&old[0].user_id===input.userId&&old[0].member_id===input.memberId)return {id:input.memberId};throw new DirectoryError('CONFLICT','이미 다른 계정 또는 교인에 연결되어 있습니다.');}
   await db.query('INSERT INTO ministry.account_links(church_id,member_id,user_id,approved_by) VALUES($1,$2,$3,$4)',[actor.churchId,input.memberId,input.userId,actor.id]);await writeMinistryRows(db,actor.churchId,before,rows(domain.snapshot()));result={id:input.memberId};
  }else{
   if(!grant.care)throw new MinistryAccessError();
   const request=source.care.find(c=>c.id===input.sourceId&&c.version===input.sourceVersion&&c.expiresAt>new Date());if(!request)throw new DirectoryError('CONFLICT','접수 정보가 변경되었거나 열람 기간이 끝났습니다.');
   const old=(await db.query('SELECT pastoral_id FROM ministry.care_intakes WHERE church_id=$1 AND source_id=$2',[actor.churchId,request.id])).rows[0];if(old)return {id:old.pastoral_id as string};
   const link=(await db.query('SELECT member_id FROM ministry.account_links WHERE church_id=$1 AND user_id=$2',[actor.churchId,request.ownerId])).rows[0];if(!link)throw new DirectoryError('INVALID','먼저 요청자의 회원 계정과 교적을 연결해 주세요.');
   result=domain.pastoral.create(current,{kind:'CARE',title:request.kind==='VISIT'?'심방 접수 확인·일정 협의':'상담 접수 확인·일정 협의',date:input.date,memberId:link.member_id,body:'문의·돌봄 접수함에서 원본 요청을 확인하고 연락해 주세요. 이 항목은 예배·심방 예약 확정을 의미하지 않습니다.',category:request.kind==='VISIT'?'VISIT':'COUNSEL',goalId:'',status:'OPEN'});
   await writeMinistryRows(db,actor.churchId,before,rows(domain.snapshot()));
   await db.query('INSERT INTO ministry.care_intakes(church_id,source_id,member_id,pastoral_id,imported_by) VALUES($1,$2,$3,$4,$5)',[actor.churchId,request.id,link.member_id,result.id,actor.id]);
  }
  const auditId=randomUUID();await db.query('INSERT INTO ministry.audits(church_id,id,payload) VALUES($1,$2,$3)',[actor.churchId,auditId,{id:auditId,churchId:actor.churchId,actorId:actor.id,memberId:input.action==='LINK'?input.memberId:'',action:'UPDATE',fields:[input.action==='LINK'?'accountLink':'careIntake'],at:new Date().toISOString()}]);
  return result;
 },{aal,enforceMfa:false});
}
