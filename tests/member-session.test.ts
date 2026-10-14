import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionStorage } from '../apps/mobile/src/lib/session-storage-core';
import { createMemberAuth } from '../packages/api-client/src/member-auth';

function memoryStore() {
  const values = new Map<string, string>();
  return { values, async getItem(key: string) { return values.get(key) ?? null; }, async setItem(key: string, value: string) { values.set(key, value); }, async removeItem(key: string) { values.delete(key); } };
}
test('encrypted-store adapter survives recreation, rotates large Unicode sessions and removes all chunks', async () => {
  const backing = memoryStore(); const store = createSessionStorage(backing);
  const session = JSON.stringify({ refresh_token: 'fixture', user: { name: '교인🙂'.repeat(1000) } });
  await store.setItem('session', session);
  assert.ok([...backing.values.values()].every(value => Buffer.byteLength(value, 'utf8') < 2048));
  assert.equal(await createSessionStorage(backing).getItem('session'), session);
  await store.setItem('session', 'rotated');
  assert.equal(await store.getItem('session'), 'rotated');
  assert.equal(backing.values.size, 2);
  await store.removeItem('session');
  assert.equal(await createSessionStorage(backing).getItem('session'), null);
  assert.equal(backing.values.size, 0);
});
test('corrupt or incomplete saved sessions fail closed and permit a fresh login', async () => {
  const backing = memoryStore(); const store = createSessionStorage(backing);
  for (const raw of ['{broken', 'null', '{"generation":42,"count":2}', '{"generation":"../other","count":1}']) {
    backing.values.set('session', raw);
    assert.equal(await store.getItem('session'), null);
    await store.removeItem('session');
    assert.equal(backing.values.has('session'), false);
  }
  await store.setItem('session', 'x'.repeat(1200));
  const m = JSON.parse(backing.values.get('session')!);
  backing.values.delete(`session.${m.generation}.1`);
  assert.equal(await store.getItem('session'), null);
  assert.equal(backing.values.size, 0);
  await store.setItem('session', 'fresh');
  assert.equal(await store.getItem('session'), 'fresh');
});
test('temporarily inaccessible storage does not silently destroy a saved login', async () => {
  const backing = memoryStore(); const store = createSessionStorage(backing);
  await store.setItem('session', 'saved');
  const locked = createSessionStorage({ ...backing, async getItem() { throw new Error('Device locked'); } });
  await assert.rejects(locked.getItem('session'));
  assert.equal(await store.getItem('session'), 'saved');
  // Logout still invalidates the manifest even when its read fails.
  await assert.rejects(locked.removeItem('session'));
  assert.equal(await store.getItem('session'), null);
});
test('failed storage write preserves the previous complete session', async () => {
  const backing = memoryStore(); let fail = false;
  const store = createSessionStorage({ ...backing, async setItem(key, value) { if (fail && key.endsWith('.1')) throw new Error('Device storage unavailable'); await backing.setItem(key, value); } });
  await store.setItem('session', 'previous'); fail = true;
  await assert.rejects(store.setItem('session', 'x'.repeat(1500)));
  assert.equal(await store.getItem('session'), 'previous');
  assert.equal(backing.values.size, 2);
});
test('real auth client restores a saved login, refreshes an expired token and persists logout', async () => {
  const backing = memoryStore(); const storage = createSessionStorage(backing);
  const options = { storage, storageKey: 'test-member-session' };
  const originalFetch = globalThis.fetch; const clients: NonNullable<ReturnType<typeof createMemberAuth>>[] = [];
  let refreshes = 0;
  const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'fixture@example.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('/logout')) return new Response(null, { status: 204 });
    if (url.includes('/token')) {
      if (url.includes('refresh_token')) { refreshes++; assert.equal(JSON.parse(String(init?.body)).refresh_token, 'fixture-refresh'); }
      return Response.json({ access_token: `fixture-access-${refreshes}`, refresh_token: refreshes ? 'rotated-refresh' : 'fixture-refresh', token_type: 'bearer', expires_in: 3600, user });
    }
    throw new Error('Unexpected test request');
  };
  const make = () => { const auth = createMemberAuth('https://session-test.supabase.co', 'sb_publishable_fixture', options)!; clients.push(auth); return auth; };
  try {
    const first = make(); const login = await first.signInWithPassword({ email: user.email, password: 'fixture-password' });
    assert.equal(login.error, null); await first.stopAutoRefresh();
    const saved = JSON.parse((await storage.getItem(options.storageKey))!);
    assert.equal(JSON.stringify(saved).includes('fixture-password'), false);
    const second = make(); assert.equal((await second.getSession()).data.session?.user.id, user.id); await second.stopAutoRefresh();
    saved.expires_at = Math.floor(Date.now() / 1000) - 60;
    await storage.setItem(options.storageKey, JSON.stringify(saved));
    const third = make(); const restored = await third.getSession();
    assert.equal(restored.error, null); assert.equal(restored.data.session?.access_token, 'fixture-access-1');
    assert.equal(refreshes, 1); assert.equal(JSON.parse((await storage.getItem(options.storageKey))!).refresh_token, 'rotated-refresh');
    await third.signOut({ scope: 'local' });
    assert.equal(await storage.getItem(options.storageKey), null);
    const fourth = make(); assert.equal((await fourth.getSession()).data.session, null);
  } finally { for (const auth of clients) await auth.stopAutoRefresh(); globalThis.fetch = originalFetch; }
});
