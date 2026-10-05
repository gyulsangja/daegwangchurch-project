import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Action, Failure } from './ui';
import { useMemberSession } from './member-session';
import { useNoticeResource } from '../hooks/use-notices';
export function BookmarkButton({ worshipId, type }: { worshipId: string; type: string }) {
  const { session } = useMemberSession();
  return <BookmarkControl key={session?.user.id ?? 'guest'} worshipId={worshipId} type={type} />;
}
function BookmarkControl({ worshipId, type }: { worshipId: string; type: string }) {
  const { bookmarks, session } = useMemberSession(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const pending = useRef(false);
  const userId = session?.user.id;
  const resource = useNoticeResource(useCallback(signal => userId ? bookmarks.list({ worshipId }, signal) : Promise.resolve({ data: [], nextPage: null }), [bookmarks, worshipId, userId]));
  const saved = resource.data?.data[0];
  async function toggle() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { if (saved) await bookmarks.remove(saved.id); else await bookmarks.save(worshipId); await resource.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다.'); }
    finally { pending.current = false; setBusy(false); }
  }
  if (!session) return <Action title="말씀 저장" onPress={() => router.push({ pathname: '/login', params: { returnTo: `/${type === 'FIRST_HOUR' ? 'devotional' : 'sermons'}/${worshipId}` } })} />;
  return <>{resource.error ? <Failure message={resource.error} retry={() => void resource.reload()} /> : <Action title={busy ? '처리 중' : resource.loading ? '저장 상태 확인 중' : saved ? '저장 해제' : '말씀 저장'} disabled={busy || resource.loading} onPress={() => void toggle()} />}{!!error && <Failure message={error} retry={() => { setError(''); void resource.reload(); }} />}</>;
}
