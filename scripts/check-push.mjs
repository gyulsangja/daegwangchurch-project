import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { pushReadiness } from './push-readiness.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readEnv = path => {
  try { return parse(readFileSync(resolve(root, path))); }
  catch { return {}; }
};
// Deliberately inspect only the documented local files, not unrelated shell secrets.
const app = readEnv('apps/mobile/.env.local');
const admin = readEnv('apps/admin/.env.local');
let firebase;
let firebaseState = 'missing';
if (app.GOOGLE_SERVICES_JSON) {
  try {
    firebase = JSON.parse(readFileSync(resolve(root, 'apps/mobile', app.GOOGLE_SERVICES_JSON), 'utf8'));
    if (!firebase || typeof firebase !== 'object' || Array.isArray(firebase)) throw new Error();
    firebaseState = 'loaded';
  } catch { firebase = undefined; firebaseState = 'unreadable'; }
}
console.log('Android 푸시 로컬 연결 점검 — 외부 접속·발송·설정 변경 없음');
const rows = pushReadiness({ app, admin, firebase, firebaseState });
for (const row of rows) console.log(`${row.status} ${row.label}${row.action ? ': ' + row.action : ''}`);
const checks = rows.filter(row => ['PASS', 'WAIT'].includes(row.status));
console.log(`로컬 설정 ${checks.filter(row => row.status === 'PASS').length}/${checks.length} 통과. 연결 순서: docs/notifications.md`);
process.exitCode = checks.some(row => row.status === 'WAIT') ? 1 : 0;
