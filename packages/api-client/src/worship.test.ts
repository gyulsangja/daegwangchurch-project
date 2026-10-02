/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { createWorshipClient, ApiError } from './worship';

const item = { id: 'test-id', version: 1, type: 'FIRST_HOUR', title: '묵상', contentDate: '2026-10-02',
  youtube: { videoId: 'T0000000001', url: 'https://www.youtube.com/watch?v=T0000000001', thumbnailUrl: null },
  preacher: null, sermonTitle: null, scriptureReference: '요한복음 1:1', description: null, summary: null };
test('mobile client sends FIRST_HOUR, month and escaped cursor', async () => {
  let url = '';
  const client = createWorshipClient('http://localhost:3000/', async (input) => { url = String(input); return Response.json({ data: [item], nextCursor: 'next' }); });
  assert.equal((await client.list({ month: '2026-10', cursor: 'a+b=' })).data[0].id, item.id);
  const query = new URL(url).searchParams;
  assert.equal(query.get('type'), 'FIRST_HOUR'); assert.equal(query.get('month'), '2026-10'); assert.equal(query.get('cursor'), 'a+b=');
});
test('mobile client rejects malformed responses instead of showing empty success', async () => {
  const client = createWorshipClient('http://localhost:3000', async () => Response.json({ data: [{ ...item, youtube: null }], nextCursor: null }));
  await assert.rejects(client.list(), ApiError);
});
test('mobile client distinguishes unpublication and unavailable service', async () => {
  for (const status of [404, 503]) {
    const client = createWorshipClient('http://localhost:3000', async () => Response.json({ error: {} }, { status }));
    await assert.rejects(client.detail('id'), (error: unknown) => error instanceof ApiError && error.status === status);
  }
});
test('mobile client does not fetch without a configured endpoint', async () => {
  const client = createWorshipClient(undefined, async () => { throw new Error('Should not fetch'); });
  await assert.rejects(client.list(), /설정되지/);
});
test('mobile client passes cancellation through to fetch', async () => {
  const controller = new AbortController(); controller.abort();
  const client = createWorshipClient('http://localhost:3000', async (_input, init) => { assert.ok(init?.signal?.aborted); throw new DOMException('Aborted', 'AbortError'); });
  await assert.rejects(client.list({ signal: controller.signal }), (error: unknown) => error instanceof DOMException && error.name === 'AbortError');
});
