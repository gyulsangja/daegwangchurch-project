import assert from 'node:assert/strict';
import test from 'node:test';
import { getAndroidUpdate } from '../packages/contracts/src/app-release';

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
