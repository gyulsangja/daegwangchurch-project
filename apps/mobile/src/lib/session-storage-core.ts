type Store = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };
type Manifest = { generation: string; count: number };
// Small encrypted chunks avoid older iOS Keychain value-size limits. Publish the
// manifest last so a failed write cannot replace a previously valid session.
export function createSessionStorage(store: Store) {
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(run: () => Promise<T>): Promise<T> => { const task = queue.then(run); queue = task.catch(() => {}); return task; };
  async function manifest(key: string): Promise<Manifest | null> {
    const raw = await store.getItem(key); if (!raw) return null;
    // Corrupted metadata must never prevent logout or a fresh login. Actual
    // device-storage errors still propagate; do not erase a temporarily locked store.
    let value: Manifest | null;
    try { value = JSON.parse(raw) as Manifest; } catch { value = null; }
    if (!value || typeof value.generation !== 'string' || !/^[a-z0-9-]{1,100}$/.test(value.generation) || !Number.isInteger(value.count) || value.count < 1 || value.count > 256) {
      await store.removeItem(key);
      return null;
    }
    return value;
  }
  const part = (key: string, m: Manifest, index: number) => `${key}.${m.generation}.${index}`;
  const clean = async (key: string, m: Manifest | null) => { if (m) await Promise.all(Array.from({ length: m.count }, (_, i) => store.removeItem(part(key, m, i)))); };
  return {
    getItem: (key: string) => serial(async () => {
      const m = await manifest(key); if (!m) return null;
      const values = await Promise.all(Array.from({ length: m.count }, (_, i) => store.getItem(part(key, m, i))));
      if (values.some(value => value === null)) {
        await store.removeItem(key);
        await clean(key, m);
        return null;
      }
      return values.join('');
    }),
    setItem: (key: string, value: string) => serial(async () => {
      const previous = await manifest(key);
      const next = { generation: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, count: Math.max(1, Math.ceil(value.length / 500)) };
      if (next.count > 256) throw new Error('Saved session exceeds storage limit');
      try {
        for (let i = 0; i < next.count; i++) await store.setItem(part(key, next, i), value.slice(i * 500, (i + 1) * 500));
        await store.setItem(key, JSON.stringify(next));
      } catch (error) { await clean(key, next).catch(() => {}); throw error; }
      await clean(key, previous).catch(() => {});
    }),
    removeItem: (key: string) => serial(async () => {
      let previous: Manifest | null = null;
      try { previous = await manifest(key); }
      finally { await store.removeItem(key); }
      await clean(key, previous);
    }),
  };
}
