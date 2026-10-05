import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Action, Failure } from './ui';
import { ConfirmDialog } from './confirm-dialog';
import { useMemberSession } from './member-session';
import { useNoticeResource } from '../hooks/use-notices';
export function SaveEventButton({ eventId }: { eventId: string }) { const { session } = useMemberSession(); return <SaveEvent key={session?.user.id ?? 'guest'} eventId={eventId} />; }
function SaveEvent({ eventId }: { eventId: string }) {
  const { session, schedules } = useMemberSession(); const userId = session?.user.id; const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const pending = useRef(false);
  const resource = useNoticeResource(useCallback(signal => userId ? schedules.list({ eventId }, signal) : Promise.resolve({ data: [], nextPage: null }), [schedules, eventId, userId]));
  const saved = resource.data?.data[0];
  async function toggle() { if (pending.current) return; pending.current = true; setBusy(true); setError(''); try { if (saved) await schedules.remove(saved.id, saved.version); else await schedules.create({ kind: 'CHURCH', eventId }); await resource.reload(); setConfirm(false); } catch (cause) { setError(cause instanceof Error ? cause.message : '일정을 저장하지 못했습니다.'); setConfirm(false); } finally { pending.current = false; setBusy(false); } }
  if (!session) return <Action title="내 일정에 추가" onPress={() => router.push({ pathname: '/login', params: { returnTo: `/events/${eventId}` } })} />;
  return <>{resource.error ? <Failure message={resource.error} retry={() => void resource.reload()} /> : <Action title={resource.loading ? '저장 상태 확인 중' : saved ? '내 일정에서 해제' : '내 일정에 추가'} disabled={resource.loading || busy} onPress={() => setConfirm(true)} />}{!!error && <Failure message={error} retry={() => { setError(''); void resource.reload(); }} />}<ConfirmDialog visible={confirm} title={saved ? '일정 저장을 해제할까요?' : '교회 일정을 저장할까요?'} message="내 일정 저장은 행사 참가 신청이 아닙니다. 일정이 변경되면 변경된 정보를 보여드립니다. 푸시 알림은 아직 제공하지 않습니다." confirmLabel={saved ? '저장 해제' : '일정 저장'} busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void toggle()} /></>;
}
