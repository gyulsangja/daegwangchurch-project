import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MemberGate, useMemberSession } from '../../components/member-session';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, styles } from '../../components/ui';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { useNoticeResource } from '../../hooks/use-notices';
export default function SchedulePage() { const { id } = useLocalSearchParams<{ id: string }>(); return <MemberGate returnTo={`/schedules/${id}`}><ScheduleDetail id={id} /></MemberGate>; }
function ScheduleDetail({ id }: { id: string }) {
  const { schedules } = useMemberSession(); const resource = useNoticeResource(useCallback(signal => schedules.detail(id, signal), [schedules, id]));
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const item = resource.data;
  async function remove() { if (!item || busy) return; setBusy(true); setError(''); try { await schedules.remove(id, item.version); setConfirm(false); router.dismissTo('/schedules'); } catch (cause) { setError(cause instanceof Error ? cause.message : '삭제하지 못했습니다.'); setConfirm(false); } finally { setBusy(false); } }
  return <AppScreen title="개인 일정 상세" onBack={() => router.dismissTo('/schedules')}>
    {resource.loading && <ActivityIndicator accessibilityLabel="일정을 불러오는 중" />}{!!resource.error && <Failure message={resource.error} retry={() => void resource.reload()} />}
    {item?.content && <><Card title={item.content.title}>개인 · {item.content.startDate} ~ {item.content.endDate}{'\n'}{item.content.allDay ? '종일' : `${item.content.startTime} ~ ${item.content.endTime} (한국 시간)`}{'\n'}{item.content.location || '장소 없음'}</Card><Card title="메모">{item.content.note || '메모가 없습니다.'}</Card><Card title="알림">푸시 알림은 아직 제공하지 않습니다.</Card><Action title="일정 수정" onPress={() => router.push({ pathname: '/schedules/edit/[id]', params: { id } })} /></>}
    {item?.eventId && (item.event ? <MenuCard title={item.event.title} description="교회 공식 일정" onPress={() => router.push({ pathname: '/events/[id]', params: { id: item.eventId! } })} /> : <Card title="현재 공개되지 않은 일정">저장을 해제할 수 있습니다.</Card>)}
    {item && <MenuCard title={item.eventId ? '저장 해제' : '일정 삭제'} onPress={() => setConfirm(true)} />}{!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
    <ConfirmDialog visible={confirm} title="일정을 삭제할까요?" message="개인 일정은 삭제 후 되돌릴 수 없습니다. 저장한 교회 일정은 내 목록에서만 제거됩니다." confirmLabel="삭제하기" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void remove()} />
  </AppScreen>;
}
