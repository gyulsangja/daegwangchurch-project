import type {MinistryConnection} from './ministry-postgres';
// Only aggregate values cross this boundary; no identities, contact fields or narrative records.
export async function readMinistrySummary(db:MinistryConnection,churchId:string,month:string){
 const result=await db.query(`SELECT
  (SELECT count(*)::int FROM ministry.members WHERE church_id=$1) AS total,
  coalesce((SELECT jsonb_agg(jsonb_build_object('name',coalesce((SELECT item->>'label' FROM jsonb_array_elements(c.payload->'statuses') item WHERE item->>'code'=s.status),s.status),'count',s.count) ORDER BY s.status)
   FROM (SELECT payload->>'status' status,count(*)::int count FROM ministry.members WHERE church_id=$1 GROUP BY payload->>'status') s),'[]'::jsonb) AS members,
  coalesce((SELECT jsonb_agg(jsonb_build_object('state',s.state,'count',s.count) ORDER BY s.state) FROM
   (SELECT payload->>'value' state,count(*)::int count FROM ministry.records WHERE church_id=$1 AND payload->>'kind'='ATTENDANCE' AND left(payload->>'date',7)=$2 AND coalesce((payload->>'voided')::boolean,false)=false GROUP BY payload->>'value') s),'[]'::jsonb) AS attendance
  FROM ministry.churches c WHERE c.id=$1`,[churchId,month]);
 if(!result.rows[0])throw Error('MINISTRY_ACCESS_DENIED');return {...result.rows[0],month};
}
