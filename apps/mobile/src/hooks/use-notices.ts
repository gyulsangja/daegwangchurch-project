import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { createNoticeClient, type Notice, type NoticePage } from '@daegwang/api-client/notices';
import {createPublicCache} from '@daegwang/api-client/public-cache';

const client = createNoticeClient(process.env.EXPO_PUBLIC_API_BASE_URL);
const publicData=createPublicCache<unknown>(15000,30);
export function useNoticeResource<T>(read: (signal: AbortSignal) => Promise<T>, refreshInterval = 0, publicKey?:string) {
  const [result,setResult]=useState<{reader:typeof read;data:T}|null>(()=>{
    const cached=publicKey?publicData.peek(publicKey):undefined;
    return cached===undefined?null:{reader:read,data:cached as T};
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async (force = false) => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setError('');setLoading(true);
    try { const value = publicKey ? await publicData.read(publicKey,()=>read(new AbortController().signal),force) as T : await read(controller.signal); if (!controller.signal.aborted) { setResult({reader:read,data:value}); setError(''); } }
    catch (cause) { if (!controller.signal.aborted) {setResult(null);setError(cause instanceof Error ? cause.message : '내용을 불러오지 못했습니다.');} }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [read,publicKey]);
  const reload = useCallback(() => load(true), [load]);
  useFocusEffect(useCallback(() => {
    void load();
    const timer = refreshInterval ? setInterval(() => { void load(true); }, refreshInterval) : undefined;
    return () => { clearInterval(timer); request.current?.abort(); };
  }, [load, refreshInterval]));
  // Never show a previous id/filter's data. Private readers are not shared/cached.
  const data=result?.reader===read?result.data:null;
  return { data, loading:loading||result!==null&&result.reader!==read, error, reload };
}
export function useNoticeList(page: number) {
  return useNoticeResource<NoticePage>(useCallback(signal => client.list(page, signal), [page]),0,`notices:${page}`);
}
export function useNotice(id: string) {
  return useNoticeResource<Notice>(useCallback(signal => client.detail(id, signal), [id]),0,`notice:${id}`);
}
export function noticeDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
}
