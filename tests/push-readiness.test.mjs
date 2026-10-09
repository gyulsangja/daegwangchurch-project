import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pushReadiness } from '../scripts/push-readiness.mjs';

const project = '12345678-1234-4234-8234-123456789012';
const fixture = () => ({
  app: { EXPO_PUBLIC_EAS_PROJECT_ID: project, EXPO_PUBLIC_API_BASE_URL: 'https://api.church.org', EXPO_PUBLIC_SUPABASE_URL: 'https://church.supabase.co', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture', GOOGLE_SERVICES_JSON: './google-services.json' },
  admin: { EXPO_PUSH_PROJECT_ID: project, NEXT_PUBLIC_SUPABASE_URL: 'https://church.supabase.co', APP_MEMBER_NOTIFICATIONS_ENABLED: 'true', APP_PUSH_WORKER_SECRET: 's'.repeat(32) },
  firebaseState: 'loaded',
  firebase: { project_info: { project_id: 'church', project_number: '123456' }, client: [{ client_info: { android_client_info: { package_name: 'org.daegwangchurch.app' }, mobilesdk_app_id: '1:123456:android:fixture' }, api_key: [{ current_key: 'fixture-key' }] }] },
});
const status = (input, id) => pushReadiness(input).find(row => row.id === id).status;

test('prepared local settings pass while disabled sending and real delivery stay distinct', () => {
  const rows = pushReadiness(fixture());
  assert.equal(rows.filter(row => row.status === 'WAIT').length, 0);
  assert.equal(rows.find(row => row.id === 'sending').status, 'INFO');
  assert.equal(rows.find(row => row.id === 'external').status, 'MANUAL');
});
test('missing configuration and unreadable Firebase files do not pass', () => {
  assert.equal(status({}, 'eas-project'), 'WAIT');
  assert.equal(status({}, 'firebase-file'), 'WAIT');
  assert.equal(status({ ...fixture(), firebase: undefined, firebaseState: 'unreadable' }, 'firebase-file'), 'WAIT');
});
test('service account accidentally selected as app config is rejected without leaking content', () => {
  const input = fixture();
  input.firebase = { ...input.firebase, type: 'service_account', private_key: 'SENSITIVE-FIXTURE', private_key_id: 'PRIVATE-ID' };
  for (const id of ['firebase-file', 'firebase-project', 'firebase-package']) assert.equal(status(input, id), 'WAIT');
  assert.doesNotMatch(JSON.stringify(pushReadiness(input)), /SENSITIVE-FIXTURE|PRIVATE-ID|fixture-key/);
});
test('Firebase package and EAS project mismatches are reported separately', () => {
  const input = fixture();
  input.app.APP_ANDROID_PACKAGE = 'org.another.app';
  input.admin.EXPO_PUSH_PROJECT_ID = '22345678-1234-4234-8234-123456789012';
  assert.equal(status(input, 'firebase-package'), 'WAIT');
  assert.equal(status(input, 'same-project'), 'WAIT');
});
test('development addresses, credentials and non-origin URLs are not deployment readiness', () => {
  for (const url of ['http://api.church.org', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://192.168.0.2', 'https://church.local', 'https://user:password@api.church.org', 'https://api.church.org/path', 'https://api.church.org?key=secret']) {
    const input = fixture(); input.app.EXPO_PUBLIC_API_BASE_URL = url;
    assert.equal(status(input, 'api-origin'), 'WAIT');
    assert.ok(!JSON.stringify(pushReadiness(input)).includes(url));
  }
});
test('server secrets and service-role public keys are rejected without echoing values', () => {
  const input = fixture();
  input.app.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = `a.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.c`;
  input.app.EXPO_PUSH_ACCESS_TOKEN = 'NEVER-ECHO-THIS';
  assert.equal(status(input, 'auth-key'), 'WAIT');
  assert.equal(status(input, 'no-server-secrets'), 'WAIT');
  assert.doesNotMatch(JSON.stringify(pushReadiness(input)), /NEVER-ECHO-THIS/);
});
