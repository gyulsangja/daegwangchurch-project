import assert from 'node:assert/strict';
import { test } from 'node:test';
import { careExpiry, carePolicySchema } from './care-service';
import { socialConsentSchema } from '@daegwang/contracts/features/member/extras';

const policy = carePolicySchema.parse({ version: 'test', notice: 'test', retentionDays: 1825, retentionYears: 5, adminIds: ['test-admin'] });
test('care retention uses calendar years and clamps leap day; legacy days remain supported', () => {
  assert.equal(careExpiry(new Date('2026-10-18T03:00:00Z'), policy).toISOString(), '2031-10-18T03:00:00.000Z');
  assert.equal(careExpiry(new Date('2028-02-29T03:00:00Z'), policy).toISOString(), '2033-02-28T03:00:00.000Z');
  assert.equal(careExpiry(new Date('2028-02-28T15:00:00Z'), policy).toISOString(), '2033-02-27T15:00:00.000Z');
  assert.equal(careExpiry(new Date('2026-10-18T03:00:00Z'), { ...policy, retentionYears: undefined, retentionDays: 90 }).toISOString(), '2027-01-16T03:00:00.000Z');
});
test('social consent requires an explicit age declaration', () => {
  const consent = { displayName: 'Test', consent: true, policyVersion: 'test' };
  for (const ageConfirmed of [undefined, false, 'true']) assert.equal(socialConsentSchema.safeParse({ ...consent, ageConfirmed }).success, false);
  assert.equal(socialConsentSchema.safeParse({ ...consent, ageConfirmed: true }).success, true);
});
