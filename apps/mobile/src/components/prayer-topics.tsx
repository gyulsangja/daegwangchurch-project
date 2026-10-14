import { useCallback, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { collectPages } from '@daegwang/api-client/pagination';
import { useMemberSession } from './member-session';
import { useNoticeResource } from '../hooks/use-notices';
import { koreaDate } from '../hooks/use-latest-devotional';
import { AppScreen, MenuCard } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
export function PrayerTopics() {
  const { client } = useMemberSession(); const [search, setSearch] = useState(''); const [answered, setAnswered] = useState(false);
  const result = useNoticeResource(useCallback(signal => collectPages((page, token) => client.list({ kind: 'SPECIAL_PRAYER', page }, token), signal), [client]));
  const rows = result.data?.filter(row => row.content.kind === 'SPECIAL_PRAYER' && !!row.content.answeredOn === answered && row.content.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <AppScreen title="이어가는 기도제목" onBack={() => router.dismissTo('/records')}>
    <MenuCard title="하루 기록 · 캘린더" description="말씀과 묵상, 그날의 기도를 함께 봐요." onPress={() => router.replace('/records')} />
    <View style={{ flexDirection: 'row', gap: 8 }}>{[false, true].map(value => <View key={String(value)} style={{ flex: 1 }}><Action title={value ? '응답과 감사' : '기도 중'} disabled={answered === value} onPress={() => setAnswered(value)} /></View>)}</View>
    <TextInput accessibilityLabel="기도제목 검색" placeholder="기도제목 검색" value={search} onChangeText={setSearch} style={styles.input} />
    {result.loading && <ActivityIndicator accessibilityLabel="기도제목을 불러오는 중" />}
    {!!result.error && <Failure message={result.error} retry={result.reload} />}
    {rows?.map(row => <MenuCard key={row.id} title={row.content.title} description={row.content.kind === 'SPECIAL_PRAYER' && row.content.answeredOn ? `응답 · ${row.content.answeredOn}` : `${row.content.date ?? '시작일 미정'}부터 품고 있는 기도`} onPress={() => router.push({ pathname: '/records/[id]', params: { id: row.id } })} />)}
    {rows && !rows.length && <Card title={search ? '찾는 기도제목이 없습니다' : answered ? '아직 남긴 응답 기록이 없습니다' : '계속 품고 싶은 기도를 남겨보세요'}>기도제목을 열어 날짜별 기도와 감사의 흐름을 이어갈 수 있습니다.</Card>}
    <Action title="새 기도제목" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'SPECIAL_PRAYER', date: koreaDate() } })} />
    <MenuCard title="날짜별 개인기도 기록" description="제목 없이 남긴 기도도 모두 보관되어 있어요." onPress={() => router.push({ pathname: '/records', params: { kind: 'PRAYER' } })} />
  </AppScreen>;
}
export function PrayerTimeline({ topicId }: { topicId: string }) {
  const { client } = useMemberSession();
  const result = useNoticeResource(useCallback(signal => collectPages((page, token) => client.list({ kind: 'PRAYER', prayerTopicId: topicId, page }, token), signal), [client, topicId]));
  const rows = [...(result.data ?? [])].sort((a, b) => (b.content.date ?? '').localeCompare(a.content.date ?? '') || b.createdAt.localeCompare(a.createdAt));
  return <>
    <Action title="이 제목으로 오늘 기도 남기기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER', prayerTopicId: topicId, date: koreaDate() } })} />
    {result.loading && <ActivityIndicator accessibilityLabel="이어온 기도를 불러오는 중" />}
    {!!result.error && <Failure message={result.error} retry={result.reload} />}
    {rows.map(row => <MenuCard key={row.id} title={`${row.content.date} · 기도`} description={row.content.body.slice(0, 160)} onPress={() => router.push({ pathname: '/records/[id]', params: { id: row.id } })} />)}
    {result.data && !rows.length && <Card title="날짜별 기도를 이어가세요">새로 남기는 기도는 이 제목 아래 모이고, 해당 날짜의 캘린더에도 함께 표시됩니다.</Card>}
  </>;
}
