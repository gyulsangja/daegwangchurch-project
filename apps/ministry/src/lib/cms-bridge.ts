import 'server-only';
import {Pool,type PoolClient} from 'pg';
import {z} from 'zod';
import {MinistryAccessError} from '@daegwang/database/ministry-postgres';
let pool:Pool|undefined;
export function bridgeEnabled(){return process.env.MINISTRY_CMS_BRIDGE_ENABLED==='true'&&!!process.env.MINISTRY_CMS_DATABASE_URL&&process.env.MINISTRY_CMS_CHURCH_ID===process.env.MINISTRY_CHURCH_ID;}
export async function readCmsInbox(userId:string,care:boolean){
 if(!bridgeEnabled())return {accounts:[],care:[],configured:false};
 pool??=new Pool({connectionString:process.env.MINISTRY_CMS_DATABASE_URL,max:1,connectionTimeoutMillis:10000,idleTimeoutMillis:10000});
 const db=await pool.connect();
 return readCmsWithConnection(db,userId,care);
}
export async function readCmsWithConnection(db:Pick<PoolClient,'query'|'release'>,userId:string,care:boolean){
 try{
  await db.query('BEGIN READ ONLY');
  const admin=await db.query('SELECT id,role FROM public.admin_profiles WHERE "authUserId"=$1::uuid AND "isActive"=true',[userId]);
  if(admin.rows.length!==1||!['ADMIN','SUPER_ADMIN'].includes(admin.rows[0].role))throw new MinistryAccessError();
  const accounts=await db.query('SELECT "ownerId",status,"realName",phone,position,version FROM public.church_memberships WHERE status=$1 ORDER BY "realName","ownerId" LIMIT 500',['CONFIRMED']);
  let requests:unknown[]=[];
  if(care){
   const settings=await db.query('SELECT policy FROM public.care_settings WHERE id=$1',['CARE']);
   const policy=z.object({adminIds:z.array(z.string())}).safeParse(settings.rows[0]?.policy);
   if(policy.success&&policy.data.adminIds.includes(admin.rows[0].id)){
    // Only routing metadata. Private request text stays in the original CMS, with its retention policy.
    requests=(await db.query('SELECT id,"ownerId",status,version,"expiresAt",content->>\'kind\' AS kind,content->>\'name\' AS name FROM public.member_care_requests WHERE "expiresAt">now() AND status IN (\'RECEIVED\',\'DISCUSSING\',\'SCHEDULED\') ORDER BY "createdAt" DESC LIMIT 100')).rows;
   }
  }
  await db.query('COMMIT');
  return {configured:true,accounts:z.array(z.object({ownerId:z.uuid(),status:z.literal('CONFIRMED'),realName:z.string(),phone:z.string(),position:z.string(),version:z.number().int()})).parse(accounts.rows),care:z.array(z.object({id:z.string(),ownerId:z.uuid(),status:z.string(),version:z.number().int(),expiresAt:z.date(),kind:z.enum(['COUNSELING','VISIT']),name:z.string()})).parse(requests)};
 }catch(error){await db.query('ROLLBACK');throw error;}finally{db.release();}
}
