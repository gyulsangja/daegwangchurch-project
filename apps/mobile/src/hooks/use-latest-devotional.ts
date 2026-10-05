import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { worshipClient, type Worship } from '../lib/api';

export function useLatestDevotional() {
  const [item, setItem] = useState<Worship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError(''); setItem(null);
    try {
      const page = await worshipClient.list({ signal: controller.signal });
      if (!controller.signal.aborted) setItem(page.data[0] ?? null);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : '말씀을 불러오지 못했습니다.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void reload(); return () => request.current?.abort(); }, [reload]));
  return { item, loading, error, reload };
}

export function koreaDate() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
