import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { deletionConfig } from '@daegwang/server/features/member/deletion-config';
import { pushConfig } from '@daegwang/server/features/member/push-config';

// Report statuses only. Never print environment values, keys, URLs or passwords.
const read = path => existsSync(path) ? parse(readFileSync(path)) : {};
const admin = read('apps/admin/.env.local'); const site = read('apps/website/.env.local'); const app = read('apps/mobile/.env.local');
const checks = [];
const check = (name, ok, action) => checks.push({ name, ok: !!ok, ...(ok ? {} : { action }) });
function https(value) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !['localhost', '127.0.0.1'].includes(u.hostname); } catch { return false; } }
function publicKey(key) {
  if (key?.startsWith('sb_publishable_')) return true;
  try { return JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'; } catch { return false; }
}
check('server-database-config', admin.DATABASE_URL && site.DATABASE_URL, 'Configure DB credentials in both server projects.');
check('same-server-database', admin.DATABASE_URL === site.DATABASE_URL && admin.DATABASE_URL, 'Verify both server projects use the intended same database.');
check('same-auth-project', admin.NEXT_PUBLIC_SUPABASE_URL && admin.NEXT_PUBLIC_SUPABASE_URL === app.EXPO_PUBLIC_SUPABASE_URL && admin.NEXT_PUBLIC_SUPABASE_URL === site.NEXT_PUBLIC_SUPABASE_URL, 'Align the three projects with the approved Supabase project.');
check('public-client-keys', publicKey(admin.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) && publicKey(app.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY), 'Use publishable/anon keys only in client configuration.');
check('mobile-no-server-secrets', !Object.keys(app).some(key => /DATABASE|DIRECT_URL|SERVICE_ROLE|SECRET_KEY|RATE_LIMIT_SALT|PUSH_WORKER_SECRET|PUSH_ACCESS_TOKEN/.test(key)), 'Remove all server-only secrets from mobile environment files.');
check('production-website-origin', https(site.NEXT_PUBLIC_SITE_URL), 'Provide the live HTTPS website origin.');
check('production-api-origin', https(app.EXPO_PUBLIC_API_BASE_URL) && https(site.ADMIN_URL), 'Provide the live HTTPS administrator/API origin.');
check('production-member-origins', admin.APP_MEMBER_ALLOWED_ORIGINS?.split(',').every(value => https(value.trim())), 'Allow only the actual HTTPS app web origins.');
check('member-records', admin.APP_MEMBER_RECORDS_ENABLED === 'true', 'Validate owner isolation and enable private records.');
check('no-preview-admin', admin.ADMIN_PREVIEW_ENABLED !== 'true', 'Disable admin preview in release configuration.');
check('account-policy-and-email', admin.APP_ACCOUNT_ENABLED === 'true' && admin.APP_ACCOUNT_EMAIL_READY === 'true' && admin.APP_ACCOUNT_POLICY && (admin.APP_ACCOUNT_RATE_LIMIT_SALT?.length ?? 0) >= 32, 'Approve policies and test SMTP/OTP delivery before public signup.');
check('account-deletion', deletionConfig(admin), 'Approve the deletion/receipt policy, configure the private provider key and retry worker, and verify deletion using isolated test accounts.');
check('physical-device-review', false, 'Record Android/iOS or selected web device testing and actual member usability review.');
check('push-server-and-schedule', pushConfig(admin).available, 'Connect Expo/FCM and a deployed five-minute worker before enabling push.');
check('matching-push-project', app.EXPO_PUBLIC_EAS_PROJECT_ID && app.EXPO_PUBLIC_EAS_PROJECT_ID === admin.EXPO_PUSH_PROJECT_ID, 'Use the same EAS project UUID in app and API server.');
for (const row of checks) console.log(`${row.ok ? 'PASS' : 'WAIT'} ${row.name}${row.action ? ': ' + row.action : ''}`);
console.log(`Configuration passed ${checks.filter(row => row.ok).length}/${checks.length}. This does not replace DB, auth or content verification.`);
process.exitCode = checks.some(row => !row.ok) ? 1 : 0;
