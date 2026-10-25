// Run only after explicit approval of the target project and initial administrator.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {parse} from 'dotenv';
import {Pool} from 'pg';
import {randomBytes,randomUUID} from 'node:crypto';
import {createDirectory,type DirectoryState} from '../packages/ministry-core/src/directory';
const email=process.env.MINISTRY_INITIAL_ADMIN_EMAIL;
if(!email||!process.argv.includes('--apply'))throw new Error('Explicit email and --apply are required');
if(existsSync('apps/ministry/.env.local'))throw new Error('Refusing to overwrite existing ministry configuration');
const env={...parse(readFileSync('packages/database/.env')),...parse(readFileSync('apps/admin/.env.local'))};
const pool=new Pool({connectionString:env.DIRECT_URL||env.DATABASE_URL,max:1,connectionTimeoutMillis:10000});
const db=await pool.connect();const role='daegwang_ministry_runtime';const churchId='daegwang';
try{
 await db.query('BEGIN');
 const found=await db.query('SELECT id FROM auth.users WHERE lower(email)=lower($1) AND deleted_at IS NULL',[email]);
 if(found.rows.length!==1)throw new Error('ADMIN_ACCOUNT_NOT_UNIQUE');
 const existing=await db.query('SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname=$1) AS schema, EXISTS(SELECT 1 FROM pg_roles WHERE rolname=$2) AS role',['ministry',role]);
 if(existing.rows[0].schema||existing.rows[0].role)throw new Error('TARGET_ALREADY_EXISTS');
 const password=randomBytes(32).toString('hex');
 const runtime=new URL(env.DATABASE_URL||env.DIRECT_URL);
 const oldUser=decodeURIComponent(runtime.username);const suffix=oldUser.includes('.')?oldUser.slice(oldUser.indexOf('.')):'';
 runtime.username=role+suffix;runtime.password=password;
 const config={MINISTRY_OPERATIONAL_ENABLED:'false',MINISTRY_ORIGIN:'http://localhost:3002',MINISTRY_CHURCH_ID:churchId,MINISTRY_DATABASE_URL:runtime.toString(),NEXT_PUBLIC_SUPABASE_URL:env.NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY,MINISTRY_CMS_BRIDGE_ENABLED:'false',MINISTRY_CMS_CHURCH_ID:churchId};
 if(!config.NEXT_PUBLIC_SUPABASE_URL||!config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new Error('AUTH_CONFIG_MISSING');
 mkdirSync('.local/ministry',{recursive:true});
 writeFileSync('.local/ministry/provision-runtime.env',Object.entries(config).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{flag:'wx'});
 // Password is generated hex, never accepted from input or printed.
 await db.query(`CREATE ROLE ${role} LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`);
 await db.query(readFileSync('packages/database/ministry/001_workspace.sql','utf8').replace(/^BEGIN;\r?$/m,'').replace(/^COMMIT;\r?$/m,''));
 const state:DirectoryState={churches:[{id:churchId,name:'대광교회',statuses:[{code:'ACTIVE',label:'재적'},{code:'DECEASED',label:'소천'},{code:'TRANSFERRED',label:'이적'}],positions:[{code:'MEMBER',label:'성도'},{code:'DEACON',label:'집사'},{code:'ELDER',label:'장로'}]}],members:[],families:[],organizations:[],audits:[]};
 const initial=createDirectory(state,randomUUID).snapshot();
 await db.query('INSERT INTO ministry.churches VALUES($1,$2)',[churchId,initial.state.churches[0]]);
 for(const year of initial.years)await db.query('INSERT INTO ministry.years VALUES($1,$2,$3)',[churchId,String(year.year),year]);
 await db.query('INSERT INTO ministry.access_grants(church_id,user_id,role,care) VALUES($1,$2,$3,true)',[churchId,found.rows[0].id,'ADMIN']);
 await db.query(`GRANT USAGE ON SCHEMA ministry TO ${role}`);
 await db.query(`GRANT SELECT,UPDATE ON ministry.churches,ministry.access_grants TO ${role}`);
 await db.query(`GRANT SELECT,INSERT,UPDATE ON ministry.members,ministry.organizations,ministry.families,ministry.years,ministry.records,ministry.pastoral,ministry.attendance_sessions,ministry.audits,ministry.account_links,ministry.care_intakes TO ${role}`);
 await db.query(`GRANT DELETE ON ministry.organizations TO ${role}`);
 await db.query('COMMIT');
 writeFileSync('apps/ministry/.env.local',readFileSync('.local/ministry/provision-runtime.env'),{flag:'wx'});
 console.log('Provisioned private ministry schema, restricted runtime login, empty church/year and one approved administrator. Activation remains disabled pending verification.');
}catch(error){await db.query('ROLLBACK');console.error('Provisioning stopped: '+((error as {code?:string}).code??'CHECK_FAILED')+'. No secret values are printed.');process.exitCode=1;}
finally{db.release();await pool.end();}
