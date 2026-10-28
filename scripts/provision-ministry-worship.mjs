import {readFileSync} from 'node:fs';
import {parse} from 'dotenv';
import pg from 'pg';
const env=parse(readFileSync('apps/admin/.env.local'));
const db=new pg.Client({connectionString:env.DIRECT_URL||env.DATABASE_URL,connectionTimeoutMillis:10000});
try{
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
 const exists=(await db.query("SELECT to_regclass('ministry.worship_sessions') IS NOT NULL AS present")).rows[0].present;
 if(process.argv.includes('--apply')&&!exists)await db.query(readFileSync('packages/database/ministry/005_worship_sessions.sql','utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));
 await db.query('COMMIT');console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'dry-run',migrationRequired:!exists,userGrantsChanged:false}));
}catch{await db.query('ROLLBACK').catch(()=>{});console.error('Worship schema provisioning failed; transaction rolled back.');process.exitCode=1;}finally{await db.end();}
