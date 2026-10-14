import test from 'node:test';
import assert from 'node:assert/strict';
import { readOfferingAccount, hasOfferingAccount } from './offering';
import { siteSettingSchema } from '../settings/schema';
test('public offering selects account fields without leaking other site options', () => {
  const account = readOfferingAccount({ offeringBank: '은행', offeringNumber: '123-456', offeringHolder: '교회', privacyOfficer: 'private', secret: 'hidden' });
  assert.deepEqual(account, { bank: '은행', number: '123-456', holder: '교회', note: '' });
  assert.equal(hasOfferingAccount(account), true);
  assert.equal(hasOfferingAccount(readOfferingAccount(null)), false);
  assert.equal(hasOfferingAccount(readOfferingAccount({ offeringBank: '은행' })), false);
});
test('settings require a complete numeric account or all account fields blank', () => {
  const base = { siteName: '교회', canonicalUrl: 'https://example.com', ...Object.fromEntries(['description', 'address', 'addressDetail', 'phone', 'email', 'mapLatitude', 'mapLongitude', 'youtubeUrl', 'transitInfo', 'parkingInfo', 'privacyOfficer', 'privacyContact'].map(key => [key, ''])) };
  assert.equal(siteSettingSchema.safeParse(base).success, true);
  assert.equal(siteSettingSchema.safeParse({ ...base, offeringBank: '은행' }).success, false);
  assert.equal(siteSettingSchema.safeParse({ ...base, offeringBank: '은행', offeringNumber: '123-456', offeringHolder: '교회' }).success, true);
  assert.equal(siteSettingSchema.safeParse({ ...base, offeringBank: '은행', offeringNumber: 'https://example.com', offeringHolder: '교회' }).success, false);
});
