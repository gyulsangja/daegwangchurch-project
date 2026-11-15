import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateReleaseTestEnvironment as validate } from '../scripts/check-release-test-env.mjs';

const ref = 'abcdefghijklmnopqrst';
function fixture() {
  return {
    TEST_SUPABASE_PROJECT_REF: ref,
    NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    EXPO_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    DATABASE_URL: `postgresql://postgres.${ref}:synthetic@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`,
    DIRECT_URL: `postgresql://postgres:synthetic@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
    EXPO_PUBLIC_API_URL: 'http://localhost:3210/api/v1',
  };
}

test('accepts matching isolated project URLs without network access', () => {
  assert.deepEqual(validate(fixture()), []);
});

test('rejects production, missing, mixed-project and remote API configurations', () => {
  assert.ok(validate({}).length);
  for (const overrides of [
    { TEST_SUPABASE_PROJECT_REF: 'ldfnuxriakuxrbduekux' },
    { EXPO_PUBLIC_SUPABASE_URL: 'https://ldfnuxriakuxrbduekux.supabase.co' },
    { DATABASE_URL: fixture().DATABASE_URL.replace(ref, 'ldfnuxriakuxrbduekux') },
    { DIRECT_URL: fixture().DIRECT_URL.replace('sslmode=require', 'sslmode=disable') },
    { DIRECT_URL: `${fixture().DIRECT_URL}&host=db.ldfnuxriakuxrbduekux.supabase.co` },
    { EXPO_PUBLIC_API_URL: 'https://daegwangchurch-admin.vercel.app/api/v1' },
  ]) assert.ok(validate({ ...fixture(), ...overrides }).length);
});

test('does not leak credentials or malformed input in diagnostics', () => {
  const marker = 'SYNTHETIC_PRIVATE_MARKER';
  const result = validate({ ...fixture(), DATABASE_URL: marker, DIRECT_URL: marker });
  assert.ok(result.length);
  assert.ok(!JSON.stringify(result).includes(marker));
});
