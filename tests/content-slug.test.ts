import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createContentSlug, decodeContentSlug } from '../packages/contracts/src/content-slug';

test('Korean and encoded addresses resolve to the same slug', () => {
  for (const slug of ['가을-말씀-사경회', '청년부', '주일-예배', 'bulletin-2026-10-21']) {
    assert.equal(decodeContentSlug(encodeURIComponent(slug)), slug);
    assert.equal(decodeContentSlug(slug), slug);
  }
  assert.equal(decodeContentSlug('broken%'), 'broken%');
});
test('same title at the same time has distinct URLs without modifying the title', () => {
  const title = '교회 소식';
  const slugs = Array.from({ length: 100 }, () => createContentSlug(title, 'notice', randomUUID()));
  assert.equal(new Set(slugs).size, 100);
  assert.ok(slugs.every(slug => slug.startsWith('교회-소식-')));
  assert.equal(createContentSlug('!!!', 'notice', 'unique'), 'notice-unique');
});
