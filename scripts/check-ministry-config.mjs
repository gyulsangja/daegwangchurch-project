import {readFileSync,existsSync} from 'node:fs';
import {parse} from 'dotenv';
const file='apps/ministry/.env.local';
const env={...(existsSync(file)?parse(readFileSync(file)):{}),...process.env};
const required=['MINISTRY_DATABASE_URL','MINISTRY_CHURCH_ID','MINISTRY_ORIGIN','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
for(const key of required)console.log(`${env[key]?'READY':'MISSING'} ${key}`);
console.log(`Operational mode: ${env.MINISTRY_OPERATIONAL_ENABLED==='true'?'enabled':'disabled'}`);
console.log(`CMS bridge: ${env.MINISTRY_CMS_BRIDGE_ENABLED==='true'?'enabled':'disabled'}`);
// Values intentionally never printed. This only checks presence, not credentials or authority.
if(required.some(key=>!env[key]))process.exitCode=1;
