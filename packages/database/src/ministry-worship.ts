import {randomUUID} from 'node:crypto';
import {MinistryAccessError,type MinistryConnection,type MinistryGrant} from './ministry-postgres';
type Resource={kind:'BULLETIN'|'WORSHIP';id:string};
export type WorshipSessionRecord={id:string;version:number;date:string;name:string;status:'PREPARING'|'COMPLETED'|'CANCELLED'|'ARCHIVED';notes:string;resources:Resource[]};
const selection='id,version,worship_date::text AS date,name,status,notes,resources';
function allow(grant:MinistryGrant){if(grant.role!=='ADMIN')throw new MinistryAccessError();}
export async function listWorshipSessions(db:MinistryConnection,grant:MinistryGrant,month:string,page:number){
 allow(grant);
 const result=await db.query(`SELECT ${selection} FROM ministry.worship_sessions WHERE church_id=$1 AND worship_date>=$2::date AND worship_date<($2::date+interval '1 month') ORDER BY worship_date DESC,id DESC OFFSET $3 LIMIT 31`,[grant.churchId,month+'-01',page*30]);
 return {data:result.rows.slice(0,30) as WorshipSessionRecord[],nextPage:result.rows.length>30?page+1:null};
}
export async function readWorshipSession(db:MinistryConnection,grant:MinistryGrant,id:string){allow(grant);return (await db.query(`SELECT ${selection} FROM ministry.worship_sessions WHERE church_id=$1 AND id=$2`,[grant.churchId,id])).rows[0] as WorshipSessionRecord|undefined;}
export async function saveWorshipSession(db:MinistryConnection,grant:MinistryGrant,input:Omit<WorshipSessionRecord,'version'>&{version:number|null}){
 allow(grant);
 const values=[grant.churchId,input.id,input.date,input.name,input.status,input.notes,JSON.stringify(input.resources),grant.userId];
 const result=input.version===null?
 await db.query(`INSERT INTO ministry.worship_sessions(church_id,id,worship_date,name,status,notes,resources,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$8) ON CONFLICT(church_id,id) DO NOTHING RETURNING ${selection}`,values):
 await db.query(`UPDATE ministry.worship_sessions SET worship_date=$3,name=$4,status=$5,notes=$6,resources=$7::jsonb,updated_by=$8,version=version+1,updated_at=now() WHERE church_id=$1 AND id=$2 AND version=$9 RETURNING ${selection}`,[...values,input.version]);
 if(result.rows.length!==1)throw new Error('WORSHIP_CONFLICT');
 const auditId=randomUUID();
 await db.query('INSERT INTO ministry.audits(church_id,id,payload) VALUES($1,$2,$3::jsonb)',[grant.churchId,auditId,JSON.stringify({id:auditId,churchId:grant.churchId,actorId:grant.userId,memberId:'',action:input.version===null?'CREATE':'UPDATE',entityType:'WORSHIP_SESSION',entityId:input.id,at:new Date().toISOString(),fields:['date','name','status','notes','resources']})]);
 return result.rows[0] as WorshipSessionRecord;
}
