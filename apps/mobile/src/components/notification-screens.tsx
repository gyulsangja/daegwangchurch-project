import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import type { NotificationPreferences } from '@daegwang/contracts/features/member/extras';
import { preferenceInputSchema } from '@daegwang/contracts/features/member/extras';
import { MemberGate, useMemberSession } from './member-session';
import { AppScreen, IntroCard, MenuCard, screenStyles } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { Choice, FormField, Toggle } from './form-controls';
import { DraftGuard } from './draft-guard';
import { noticeDate, useNoticeResource } from '../hooks/use-notices';
import { usePagedResource } from '../hooks/use-paged-resource';
import { PushDeviceControls } from './push-notifications';
export function NotificationList() { return <MemberGate returnTo="/notifications"><List /></MemberGate>; }
function List() {
  const { extras } = useMemberSession(); const [category, setCategory] = useState('ALL');
  const { data, error, loading, reload, more } = usePagedResource(useCallback((page, signal) => extras.notifications(page, category, signal), [extras, category]));
  return <AppScreen title="알림센터" onBack={() => router.canGoBack() ? router.back() : router.replace('/')}>
    <Choice label="알림 분류" value={category} onChange={setCategory} options={[["ALL", "전체"], ["WORD", "말씀"], ["NEWS", "교회소식"], ["SCHEDULE", "일정"]]} />
    <Action secondary title="새 알림 확인" disabled={loading} onPress={reload} />
    {loading && <ActivityIndicator accessibilityLabel="알림을 불러오는 중" />}{!!error && <Failure message={error} retry={data ? more : reload} />}
    {data && !data.data.length && <Card title="아직 받은 알림이 없습니다">알림 설정에서 이 휴대폰의 푸시를 연결하고 원하는 항목을 켜 주세요. 새 알림은 앱을 닫아 두어도 전달되며, 관련 내용을 이곳에서 다시 볼 수 있습니다.</Card>}
    {data?.data.map(item => <MenuCard key={item.id} title={item.title} description={`${item.readAt ? '읽음' : '읽지 않음'} · ${noticeDate(item.createdAt)}`} onPress={() => router.push({ pathname: '/notifications/[id]', params: { id: item.id } })} />)}
    {data?.nextPage != null && <Action title="알림 더 보기" disabled={loading} onPress={more} />}<MenuCard title="알림 설정" onPress={() => router.push('/notifications/settings')} />
  </AppScreen>;
}
export function NotificationDetail() { const { id } = useLocalSearchParams<{ id: string }>(); return <MemberGate returnTo={`/notifications/${id}`}><Detail id={id} /></MemberGate>; }
function Detail({ id }: { id: string }) {
  const { extras } = useMemberSession(); const [readError, setReadError] = useState('');
  const { data, loading, error, reload } = useNoticeResource(useCallback(async signal => { const item = await extras.notification(id, signal); if (!signal.aborted && !item.readAt) { try { await extras.markRead(id); setReadError(''); } catch { if (!signal.aborted) setReadError('읽음 표시를 저장하지 못했습니다.'); } } return item; }, [extras, id]));
  return <AppScreen title="알림 상세" onBack={() => router.dismissTo('/notifications')}>
    {loading && <ActivityIndicator accessibilityLabel="알림을 불러오는 중" />}{!!error && <Failure message={error} retry={reload} />}{!!readError && <Failure message={readError} retry={reload} />}
    {data && <><Card title={data.title}>{noticeDate(data.createdAt)}</Card><Card title="알림 내용">{data.body}</Card>{data.target && <Action title="관련 내용 보기" onPress={() => router.push(`/${data.target!.kind}/${data.target!.id}` as Href)} />}</>}
  </AppScreen>;
}
export function NotificationSettings() { return <MemberGate returnTo="/notifications/settings"><Settings /></MemberGate>; }
function Settings() {
  const { extras } = useMemberSession(); const [value, setValue] = useState<NotificationPreferences | null>(null); const [original, setOriginal] = useState(''); const [time, setTime] = useState(''); const [modal, setModal] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const result = useNoticeResource(useCallback(async signal => { const data = await extras.preferences(signal); if (!signal.aborted) { setValue(data); setOriginal(JSON.stringify(data)); } return data; }, [extras]));
  async function save() { if (!value || lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage(''); try { const saved = await extras.savePreferences(value); setValue(saved); setOriginal(JSON.stringify(saved)); setMessage('알림 설정을 저장했습니다.'); } catch (cause) { setError(cause instanceof Error ? cause.message : '설정을 저장하지 못했습니다.'); } finally { lock.current = false; setBusy(false); } }
  return <AppScreen title="알림 설정" onBack={() => router.canGoBack() ? router.back() : router.replace('/my')}>
    <PushDeviceControls />
    {result.loading && <ActivityIndicator accessibilityLabel="설정을 불러오는 중" />}{!!result.error && <Failure message={result.error} retry={result.reload} />}
    {value && <>
      <IntroCard title="내게 필요한 소식만">모든 항목은 직접 켜야 받을 수 있습니다. 아래 선택은 계정에 저장되고, 푸시 연결은 휴대폰마다 따로 설정합니다.</IntroCard>
      {([['devotional', '첫시간 주님께 · 하루 한 번'], ['worship', '새 예배 말씀'], ['notices', '중요 공지'], ['events', '새 교회 행사 소식'], ['schedules', '내가 만든·저장한 일정']] as const).map(([key, label]) => <Toggle key={key} label={label} value={value[key]} disabled={busy} onChange={enabled => { setValue({ ...value, [key]: enabled }); setMessage(''); }} />)}
      <MenuCard title="묵상 알림 시간" description={`${value.devotionalTime} · 한국 시간`} onPress={() => { if (!busy) { setTime(value.devotionalTime); setError(''); setModal(true); } }} />
      <IntroCard title="하루의 흐름을 방해하지 않도록">첫시간은 당일 말씀이 준비된 경우에만 보냅니다. 예배 말씀·중요 공지·행사 소식은 밤 10시~오전 8시를 피해 하루 최대 5건까지 전합니다.</IntroCard>
      <IntroCard title="일정은 미리, 개인 내용은 조용히">내 일정은 시작 30분 전, 종일 일정은 오전 8시에 안내합니다. 새벽 일정은 당일 0시부터 확인하며, 휴대폰 상태에 따라 늦어질 수 있습니다. 잠금 화면에는 개인 제목이나 메모를 표시하지 않습니다.</IntroCard>
      <Action title={busy ? '저장 중' : '알림 설정 저장'} disabled={busy} onPress={() => void save()} />
    </>}
    {!!error && !modal && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}{!!message && <Text accessibilityLiveRegion="polite" style={styles.caption}>{message}</Text>}
    <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}><View style={screenStyles.overlay}><View role="dialog" aria-modal={true} accessibilityViewIsModal style={screenStyles.dialog}>
      <Text accessibilityRole="header" style={styles.title}>묵상 알림시간</Text><IntroCard title="말씀과 만나는 시간">한국 시간 기준입니다. 이 휴대폰의 푸시와 첫시간 항목을 켜고 저장하면, 선택한 시각 이후 당일 말씀이 준비되었을 때 알려드립니다.</IntroCard>
      <FormField label="알림 시간 · HH:mm" value={time} onChangeText={setTime} maxLength={5} keyboardType="numbers-and-punctuation" />
      {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
      <Action title="시간 적용" onPress={() => { if (!preferenceInputSchema.shape.devotionalTime.safeParse(time).success) { setError('시간은 00:00~23:59 사이의 HH:mm 형식으로 입력해 주세요.'); return; } if (value) setValue({ ...value, devotionalTime: time }); setError(''); setModal(false); }} />
      <Action title="취소" onPress={() => { setError(''); setModal(false); }} />
    </View></View></Modal>
    <DraftGuard dirty={!!value && JSON.stringify(value) !== original} busy={busy} />
  </AppScreen>;
}
