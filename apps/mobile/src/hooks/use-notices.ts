import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { createNoticeClient, type Notice, type NoticePage } from '@daegwang/api-client/notices';

const client = createNoticeClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export function useNoticeResource<T>(read: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setData(null); setError(''); setLoading(true);
    try { const value = await read(controller.signal); if (!controller.signal.aborted) setData(value); }
    catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '공지를 불러오지 못했습니다.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [read]);
  useFocusEffect(useCallback(() => { void reload(); return () => request.current?.abort(); }, [reload]));
  return { data, loading, error, reload };
}
export function useNoticeList(page: number) {
  return useNoticeResource<NoticePage>(useCallback(signal => client.list(page, signal), [page]));
}
export function useNotice(id: string) {
  return useNoticeResource<Notice>(useCallback(signal => client.detail(id, signal), [id]));
}
export function noticeDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
