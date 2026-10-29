import type {Pool,PoolClient} from 'pg';
// Structural interfaces allow the same transaction implementation to run in PostgreSQL integration tests.
export type MinistryConnection=Pick<PoolClient,'query'>;
export class MinistryAccessError extends Error {constructor(){super('MINISTRY_ACCESS_DENIED');this.name='MinistryAccessError';}}
export type MinistryGrant={churchId:string;userId:string;role:'ADMIN'|'OFFICE'|'LEADER'|'CONTENT'|'COUNCIL';care:boolean;organizationIds:string[];scopeYear?:number;canPrint:boolean;canDelete:boolean};
type Row={id:string;payload:unknown};
export type MinistryRows={church:unknown;members:Row[];organizations:Row[];families:Row[];years:Row[];records:Row[];pastoral:Row[];attendance_sessions:Row[];audits:Row[]};
const tables=['members','organizations','families','years','records','pastoral','attendance_sessions','audits'] as const;
export type MinistryTable=typeof tables[number];
export async function ministryTransaction<T>(pool:Pick<Pool,'connect'>,userId:string,churchId:string,work:(db:MinistryConnection,grant:MinistryGrant)=>Promise<T>,security?:{aal:string;enforceMfa:boolean;readOnly?:boolean}):Promise<T>{
 const db=await pool.connect();
 try{
  await db.query('BEGIN');
  await db.query("SELECT set_config('ministry.user_id',$1,true),set_config('ministry.church_id',$2,true),set_config('statement_timeout','10000',true)",[userId,churchId]);
  const role=await db.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');
  if(role.rows[0]?.rolsuper||role.rows[0]?.rolbypassrls)throw new MinistryAccessError();

  // Only domain mutations serialize on the church. Reads retain the grant lock so
  // revocation cannot race an authorized read/audit, but do not block other readers.
  const church=await db.query('SELECT id FROM ministry.churches WHERE id=$1'+(security?.readOnly?'':' FOR UPDATE'),[churchId]);
  if(church.rows.length!==1)throw new MinistryAccessError();
  const result=await db.query('SELECT to_jsonb(g) AS grant FROM ministry.access_grants g WHERE user_id=$1::uuid AND church_id=$2 AND active FOR SHARE',[userId,churchId]);
  if(result.rows.length!==1)throw new MinistryAccessError();
  const g=result.rows[0].grant;
  if(security?.enforceMfa&&(g.role==='ADMIN'||g.care)&&security.aal!=='aal2')throw new Error('MINISTRY_MFA_REQUIRED');
  const value=await work(db,{churchId,userId,role:g.role,care:g.care,organizationIds:g.organization_ids??[],scopeYear:g.scope_year??undefined,canPrint:g.can_print??true,canDelete:g.can_delete??true});
  await db.query('COMMIT');return value;
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
export async function readMinistryRows(db:MinistryConnection,churchId:string,selected:readonly MinistryTable[]=tables):Promise<MinistryRows>{
 // One statement gives all selected tables the same snapshot and avoids nine
 // sequential network round trips. Identifiers come only from this allowlist.
 const columns=tables.map(table=>{
  if(!selected.includes(table))return `'[]'::jsonb AS ${table}`;
  const order=table==='records'?"payload->>'recordedAt',id":table==='audits'?"payload->>'at',id":'id';
  return `(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'payload',payload) ORDER BY ${order}),'[]'::jsonb) FROM ministry.${table} WHERE church_id=$1) AS ${table}`;
 });
 const result=await db.query(`SELECT payload AS church,${columns.join(',')} FROM ministry.churches WHERE id=$1`,[churchId]);
 if(!result.rows[0])throw new MinistryAccessError();
 return result.rows[0] as MinistryRows;
}
export async function appendMinistryAudits(db:MinistryConnection,churchId:string,audits:Row[]){
 if(!audits.length)return;
 await db.query("INSERT INTO ministry.audits(church_id,id,payload) SELECT $1,item->>'id',item->'payload' FROM jsonb_array_elements($2::jsonb) item",[churchId,JSON.stringify(audits)]);
}
export async function writeMinistryRows(db:MinistryConnection,churchId:string,before:MinistryRows,after:MinistryRows){
 if(JSON.stringify(before.church)!==JSON.stringify(after.church))await db.query('UPDATE ministry.churches SET payload=$2::jsonb WHERE id=$1',[churchId,JSON.stringify(after.church)]);
 for(const table of tables){
  const previous=new Map(before[table].map(r=>[r.id,JSON.stringify(r.payload)]));
  for(const row of after[table]){
   if(previous.get(row.id)===JSON.stringify(row.payload))continue;
   const member=(row.payload as {memberId?:string}).memberId||null;
   if(table==='records'||table==='pastoral')await db.query(`INSERT INTO ministry.${table}(church_id,id,member_id,payload) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(church_id,id) DO UPDATE SET member_id=excluded.member_id,payload=excluded.payload`,[churchId,row.id,member,JSON.stringify(row.payload)]);
   else await db.query(`INSERT INTO ministry.${table}(church_id,id,payload) VALUES($1,$2,$3::jsonb) ON CONFLICT(church_id,id) DO UPDATE SET payload=excluded.payload`,[churchId,row.id,JSON.stringify(row.payload)]);
  }
  // Organizations are an editable current catalog; other domain records are retained/archived.
  if(table==='organizations')for(const row of before[table])if(!after[table].some(r=>r.id===row.id))await db.query('DELETE FROM ministry.organizations WHERE church_id=$1 AND id=$2',[churchId,row.id]);
 }
}
