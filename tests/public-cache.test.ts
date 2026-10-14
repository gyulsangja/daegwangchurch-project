import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPublicCache } from '@daegwang/api-client/public-cache';
test('public cache deduplicates startup and screen requests and expires by time', async () => {
  let now = 0; let calls = 0; const cache = createPublicCache<number>(60, 2, () => now);
  const fetcher = async () => { calls++; return calls; };
  assert.deepEqual(await Promise.all([cache.read('first', fetcher), cache.read('first', fetcher)]), [1, 1]);
  assert.equal(await cache.read('first', fetcher), 1); assert.equal(calls, 1);
  now = 60; assert.equal(cache.peek('first'), undefined); assert.equal(await cache.read('first', fetcher), 2);
  assert.equal(await cache.read('first', fetcher, true), 3);
});
test('public cache separates filters, bounds memory, and clears failed refreshes', async () => {
  const cache = createPublicCache<number>(60000, 2);
  await cache.read('first', async () => 1); await cache.read('sunday', async () => 2); await cache.read('special', async () => 3);
  assert.equal(cache.peek('first'), undefined); assert.equal(cache.peek('sunday'), 2);
  await assert.rejects(cache.read('sunday', async () => { throw new Error('offline'); }, true));
  assert.equal(cache.peek('sunday'), undefined);
});
