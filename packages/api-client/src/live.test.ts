import test from 'node:test';
import assert from 'node:assert/strict';
import { createLiveClient } from './live';

const broadcast = { videoId: 'abcdefghijk', title: '주일예배', channelTitle: '대광교회', startedAt: '2026-10-11T02:00:00Z', embeddable: true };
test('mobile reads the shared public website result without member credentials', async () => {
  const client = createLiveClient('https://church.example', async (url, init) => {
    assert.equal(url, 'https://church.example/api/live');
    assert.equal(init?.credentials, 'omit');
    assert.equal(new Headers(init?.headers).has('Authorization'), false);
    return Response.json({ status: 'live', checkedAt: new Date().toISOString(), broadcast });
  });
  assert.deepEqual(await client.current(), broadcast);
});
test('expired, offline, disabled and unavailable responses never display a live card', async () => {
  for (const status of ['offline', 'disabled', 'unavailable']) {
    const client = createLiveClient('https://church.example', async () => Response.json({ status, checkedAt: new Date().toISOString(), broadcast: null }));
    assert.equal(await client.current(), null);
  }
  const client = createLiveClient('https://church.example', async () => Response.json({ status: 'live', checkedAt: new Date(Date.now() - 181000).toISOString(), broadcast }));
  assert.equal(await client.current(), null);
});
test('invalid identity/status and failed network responses are rejected', async () => {
  for (const payload of [{ status: 'live', broadcast: null }, { status: 'live', broadcast: { ...broadcast, videoId: 'bad/id' } }]) {
    const client = createLiveClient('https://church.example', async () => Response.json({ checkedAt: new Date().toISOString(), ...payload }));
    await assert.rejects(client.current());
  }
  await assert.rejects(createLiveClient('https://church.example', async () => new Response(null, { status: 503 })).current());
  assert.equal(await createLiveClient(undefined).current(), null);
});
