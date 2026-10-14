// Memory-only bounded cache for public data. Never use for member records.
export function createPublicCache<T>(ttl = 60000, limit = 20, now = () => Date.now()) {
  const values = new Map<string, { data: T; at: number }>(); const pending = new Map<string, Promise<T>>();
  function peek(key: string) { const entry = values.get(key); if (!entry || now() - entry.at >= ttl) { values.delete(key); return undefined; } return entry.data; }
  return { peek, async read(key: string, fetcher: () => Promise<T>, force = false) {
    const existing = pending.get(key); if (existing) return existing;
    const cached = peek(key); if (!force && cached !== undefined) return cached;
    const promise = fetcher().then(data => { values.delete(key); values.set(key, { data, at: now() }); while (values.size > limit) values.delete(values.keys().next().value!); return data; }).catch(cause => { values.delete(key); throw cause; }).finally(() => pending.delete(key));
    pending.set(key, promise); return promise;
  } };
}
