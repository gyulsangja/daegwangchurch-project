import type {MinistryConnection,MinistryGrant} from './ministry-postgres';
import {MinistryAccessError} from './ministry-postgres';
// The caller holds the church mutation lock for mapping/application, as annual configuration does.
export async function readOrganizationSyncSource<T>(db:MinistryConnection,grant:MinistryGrant){
 if(grant.role!=='ADMIN')throw new MinistryAccessError();
 const result=await db.query("SELECT y.payload AS period,(SELECT coalesce(jsonb_agg(jsonb_build_object('memberId',member_id,'userId',user_id)),'[]'::jsonb) FROM ministry.account_links WHERE church_id=$1) AS links FROM ministry.years y WHERE y.church_id=$1 AND y.payload->>'state'='ACTIVE'",[grant.churchId]);
 if(result.rows.length!==1)throw new Error('MINISTRY_NOT_INITIALIZED');
 return result.rows[0] as {period:T;links:{memberId:string;userId:string}[]};
}
export async function writeOrganizationGroupMapping(db:MinistryConnection,grant:MinistryGrant,period:{churchId:string;year:number;version:number;state:string},previousVersion:number){
 if(grant.role!=='ADMIN'||period.churchId!==grant.churchId||period.state!=='ACTIVE')throw new MinistryAccessError();
 const result=await db.query("UPDATE ministry.years SET payload=$3::jsonb WHERE church_id=$1 AND id=$2 AND (payload->>'version')::integer=$4 AND payload->>'state'='ACTIVE'",[grant.churchId,String(period.year),JSON.stringify(period),previousVersion]);
 if(result.rowCount!==1)throw new Error('ORGANIZATION_SYNC_CONFLICT');
}
