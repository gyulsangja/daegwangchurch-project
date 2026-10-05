import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { GroupSnapshot } from '@daegwang/contracts/features/member/groups';
import { createPublicGroupClient } from '@daegwang/api-client/groups';
import { AppScreen, IntroCard } from '../components/app-screen';
import { useMemberSession } from '../components/member-session';
import { Action, Card, Failure, styles } from '../components/ui';
import { Check, Choice, Toggle } from '../components/form-controls';
import { DraftGuard } from '../components/draft-guard';
import { useNoticeResource } from '../hooks/use-notices';
const publicGroups = createPublicGroupClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export default function Groups() { const { session } = useMemberSession(); return session ? <GroupLoader key={session.user.id} /> : <GuestGroups />; }
function GuestGroups() {
  const resource = useNoticeResource(useCallback(signal => publicGroups(signal), []));
  return <AppScreen title="우리 모임 소식" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}><IntroCard title="함께하는 모임">공개 모임 소식은 로그인 없이 읽을 수 있습니다. 관심 모임 저장과 확인된 소속 안내는 로그인 후 이용하세요.</IntroCard>
    <Action title="로그인" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/groups' } })} />
    {resource.loading && <ActivityIndicator accessibilityLabel="공개 모임 소식을 불러오는 중" />}{!!resource.error && <Failure message={resource.error} retry={resource.reload} />}
    {resource.data?.notices.map(row => <Card key={row.id} title={`공개 소식 · ${row.title}`}>{row.body}</Card>)}
    {resource.data && !resource.data.notices.length && <Card title="공개 모임 소식이 없습니다">새로운 안내가 등록되면 이곳에서 확인할 수 있습니다.</Card>}
    <Action secondary title="교회 전체 공지 보기" onPress={() => router.push('/notices')} />
  </AppScreen>;
}
function GroupLoader() {
  const { extras } = useMemberSession(); const resource = useNoticeResource(useCallback(signal => extras.groups(signal), [extras]));
  return <AppScreen title="우리 모임 소식" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    <IntroCard title="함께 믿음으로 자라가는 우리">전도회와 소속의 공개 소식을 모아보세요. 관심 선택은 소속 가입이나 승인이 아닙니다.</IntroCard>
    {process.env.EXPO_PUBLIC_DEMO_MODE === 'true' && <Text style={styles.caption}>예시 모임으로 체험합니다. 실제 모임명과 소속 확인은 운영 연결 후 관리합니다.</Text>}
    {resource.loading && <ActivityIndicator accessibilityLabel="모임 소식을 불러오는 중" />}
    {!!resource.error && <Failure message="모임 소식 연결을 준비하고 있습니다. 지금은 교회 전체 공지를 이용해 주세요." retry={resource.reload} />}
    {resource.data && <GroupContent key={resource.data.version} initial={resource.data} />}
    <Action secondary title="교회 전체 공지 보기" onPress={() => router.push('/notices')} />
  </AppScreen>;
}
function GroupContent({ initial }: { initial: GroupSnapshot }) {
  const { extras } = useMemberSession(); const [saved, setSaved] = useState(initial); const [interests, setInterests] = useState(initial.interests); const [notifications, setNotifications] = useState(initial.notifications); const [filter, setFilter] = useState('ALL'); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const dirty = JSON.stringify(interests.slice().sort()) !== JSON.stringify(saved.interests.slice().sort()) || notifications !== saved.notifications;
  async function save() { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage(''); try { const next = await extras.saveGroups({ interests, notifications, version: saved.version }); setSaved(next); setMessage('관심 모임과 알림 선택을 저장했습니다. 실제 푸시 발송은 연결 전입니다.'); } catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 다시 시도해 주세요.'); } finally { lock.current = false; setBusy(false); } }
  const rows = saved.notices.filter(row => filter === 'ALL' || (filter === 'INTEREST' ? saved.interests.includes(row.groupId) : saved.memberships.includes(row.groupId)));
  return <>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Image source={require('../../assets/figma/church.png')} accessible={false} style={{ width: 32, height: 32 }} /><Text accessibilityRole="header" style={styles.title}>관심 모임 선택</Text></View>
    {saved.groups.map(group => <View key={group.id} style={{ gap: 5 }}><Check label={group.name} value={interests.includes(group.id)} disabled={busy} onChange={checked => { setMessage(''); setInterests(checked ? [...interests, group.id] : interests.filter(id => id !== group.id)); }} /><Text style={styles.caption}>{group.description}{saved.memberships.includes(group.id) ? '\n소속 확인됨 · 개발 체험에서는 가상 소속입니다.' : ''}</Text></View>)}
    <Toggle label="선택한 모임의 공개 소식 알림" value={notifications} onChange={setNotifications} disabled={busy} />
    <Text style={styles.caption}>기본은 꺼짐입니다. 실제 휴대폰 알림은 아직 발송하지 않습니다. 소속 전용 안내는 관심 선택과 관계없이 서버에서 확인한 소속만 볼 수 있습니다.</Text>
    <Action title="모임 설정 저장" disabled={busy || !dirty} onPress={() => void save()} />
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}{!!message && <Text accessibilityLiveRegion="polite" style={styles.caption}>{message}</Text>}
    <Choice label="모임 소식 보기" value={filter} onChange={setFilter} options={[["ALL", "전체 공개·내 소속"], ["INTEREST", "관심 모임"], ["MEMBER", "내 소속"]]} />
    {!rows.length && <Card title="표시할 모임 소식이 없습니다">관심 모임을 선택해 저장하거나 다른 분류를 확인해 주세요.</Card>}
    {rows.map(row => <Card key={row.id} title={`${row.audience === 'PUBLIC' ? '공개 소식' : '소속 안내'} · ${row.title}`}>{row.body}</Card>)}
    <DraftGuard dirty={dirty} busy={busy} />
  </>;
}
