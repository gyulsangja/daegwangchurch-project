import { liveStatusSchema, type LiveBroadcast } from '@daegwang/contracts/features/worship/live';

export function createLiveClient(websiteUrl: string | undefined, fetcher: typeof fetch = fetch) {
  return {
    async current(signal?: AbortSignal): Promise<LiveBroadcast | null> {
      if (!websiteUrl) return null;
      const base = new URL(websiteUrl);
      if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Invalid website origin');
      const controller = new AbortController();
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort);
      if (signal?.aborted) abort();
      const timer = setTimeout(abort, 15000);
      try {
        const response = await fetcher(`${base.origin}/api/live`, { signal: controller.signal, headers: { Accept: 'application/json' }, credentials: 'omit' });
        if (!response.ok) throw new Error('Live status unavailable');
        const result = liveStatusSchema.parse(await response.json());
        const age = Date.now() - Date.parse(result.checkedAt);
        return result.status === 'live' && age >= -60000 && age < 180000 ? result.broadcast : null;
      } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    },
  };
}
