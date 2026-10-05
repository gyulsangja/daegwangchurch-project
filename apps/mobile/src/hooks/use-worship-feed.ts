import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { worshipClient, type WorshipPage } from '../lib/api';
import type { WorshipListOptions } from '@daegwang/api-client/worship';
export function useWorshipFeed(options: Omit<WorshipListOptions, 'signal' | 'cursor'>, enabled = true) {
  const key = JSON.stringify(options);
  const [data, setData] = useState<WorshipPage | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async (cursor?: string) => {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setError(''); setLoading(true); if (!cursor) setData(null);
    try {
      const result = await worshipClient.list({ ...JSON.parse(key), cursor, signal: controller.signal });
      if (!controller.signal.aborted) setData(previous => ({ ...result, data: cursor ? [...(previous?.data ?? []), ...result.data.filter(item => !previous?.data.some(old => old.id === item.id))] : result.data }));
    } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '말씀을 불러오지 못했습니다.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [key]);
  useFocusEffect(useCallback(() => { if (enabled) void load(); return () => request.current?.abort(); }, [load, enabled]));
  return { data, loading, error, reload: () => void load(), more: () => void load(data?.nextCursor ?? undefined) };
}
