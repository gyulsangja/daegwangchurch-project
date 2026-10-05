import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
export function usePagedResource<T extends { id: string }>(read: (page: number, signal: AbortSignal) => Promise<{ data: T[]; nextPage: number | null }>) {
  const [data, setData] = useState<{ data: T[]; nextPage: number | null } | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const request = useRef<AbortController | null>(null);
  const load = useCallback(async (page = 0) => { request.current?.abort(); const controller = new AbortController(); request.current = controller; setLoading(true); setError(''); if (!page) setData(null);
    try { const result = await read(page, controller.signal); if (!controller.signal.aborted) setData(previous => ({ ...result, data: page ? [...new Map([...(previous?.data ?? []), ...result.data].map(item => [item.id, item])).values()] : result.data })); }
    catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '목록을 불러오지 못했습니다.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [read]);
  useFocusEffect(useCallback(() => { void load(); return () => request.current?.abort(); }, [load]));
  return { data, loading, error, reload: () => void load(), more: () => void load(data?.nextPage ?? 0) };
}
