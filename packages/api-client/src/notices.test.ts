/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';
import { createNoticeClient } from './notices';
import { ApiError } from './worship';

test('notice client sends page and distinguishes empty from malformed', async () => {
  const client = createNoticeClient('https://example.com', async input => {
    assert.equal(String(input), 'https://example.com/api/v1/notices?page=2');
    return Response.json({ data: [], nextPage: null });
  });
  assert.deepEqual(await client.list(2), { data: [], nextPage: null });
  await assert.rejects(createNoticeClient('https://example.com', async () => Response.json({})).list(), ApiError);
});
test('notice client distinguishes hidden and failed reads and respects cancellation', async () => {
  for (const status of [404, 503]) await assert.rejects(createNoticeClient('https://example.com', async () => new Response('', { status })).detail('test'),
    (error: unknown) => error instanceof ApiError && error.status === status);
  const controller = new AbortController(); controller.abort();
  const client = createNoticeClient('https://example.com', async (_url, options) => {
    assert.equal(options?.signal?.aborted, true); throw new DOMException('Aborted', 'AbortError');
  });
  await assert.rejects(client.list(0, controller.signal), { name: 'AbortError' });
  await assert.rejects(createNoticeClient(undefined).list(), /설정되지/);
});
