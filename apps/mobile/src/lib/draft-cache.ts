// Memory only: no personal text in disk, URLs, analytics or browser storage.
export function createDraftCache(now = () => Date.now()) {
  let activeOwner: string | null = null;
  const entries = new Map<string, { owner: string; value: unknown; expires: number }>();
  return {
    activate(owner: string) { if (activeOwner && owner !== activeOwner) entries.clear(); activeOwner = owner; },
    clear() { entries.clear(); activeOwner = null; },
    remove(owner: string, key: string) { if (owner === activeOwner) entries.delete(key); },
    read<T>(owner: string, key: string): T | null { const row = entries.get(key); if (!row || row.owner !== owner || owner !== activeOwner || row.expires <= now()) return null; return row.value as T; },
    write<T>(owner: string, key: string, value: T) { if (owner !== activeOwner) return; if (entries.size >= 20 && !entries.has(key)) entries.delete(entries.keys().next().value!); entries.set(key, { owner, value: JSON.parse(JSON.stringify(value)), expires: now() + 30 * 60000 }); },
  };
}
export const draftCache = createDraftCache();
