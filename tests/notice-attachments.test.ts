import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeNoticeSlug, isNoticeImage } from '../packages/contracts/src/features/notices/attachments';
test('notice slugs accept both Korean and encoded route parameters without crashing on malformed encoding', () => {
  const slug = '가을-말씀-사경회-mvgdmo87';
  assert.equal(decodeNoticeSlug(encodeURIComponent(slug)), slug);
  assert.equal(decodeNoticeSlug(slug), slug);
  assert.equal(decodeNoticeSlug('invalid%route'), 'invalid%route');
});
test('inline previews only accept supported raster images', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) assert.equal(isNoticeImage(type), true);
  for (const type of ['image/svg+xml', 'application/pdf', 'text/html', '']) assert.equal(isNoticeImage(type), false);
});
