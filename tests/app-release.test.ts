import assert from 'node:assert/strict';
import test from 'node:test';
import { allowsApkUpdate, getAndroidUpdate } from '../packages/contracts/src/app-release';

test('store and unclassified builds never offer APK sideload updates', () => {
  assert.equal(allowsApkUpdate('internal'), true);
  for (const distribution of ['store', 'production', '', undefined, null, true]) {
    assert.equal(allowsApkUpdate(distribution), false);
  }
});

const release = { applicationId: 'org.daegwangchurch.app', version: '1.0.1', build: 12, downloadUrl: 'https://expo.dev/artifacts/eas/example.apk', notes: '수정 사항' };
test('only newer builds of the same app prompt for update', () => {
  assert.ok(getAndroidUpdate(release, '11', release.applicationId));
  for (const build of ['12', '13', 'bad', '0', null]) assert.equal(getAndroidUpdate(release, build, release.applicationId), null);
  assert.equal(getAndroidUpdate(release, '11', 'host.exp.exponent'), null);
});
test('unpublished or unsafe downloads never prompt', () => {
  for (const value of [null, {}, { ...release, build: -1 }, { ...release, downloadUrl: 'https://evil.example/app.apk' }, { ...release, downloadUrl: 'http://expo.dev/artifacts/eas/example.apk' }]) {
    assert.equal(getAndroidUpdate(value, '11', release.applicationId), null);
  }
});
