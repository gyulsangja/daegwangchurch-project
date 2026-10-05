import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { collectPages } from '@daegwang/api-client/pagination';
import { useMemberSession } from './member-session';
import { AppScreen, MenuCard } from './app-screen';
import { DayCalendar } from './day-calendar';
import { Action, Card, Failure, styles } from './ui';
import { useNoticeResource } from '../hooks/use-notices';
import { koreaDate } from '../hooks/use-latest-devotional';

export function ReflectionCalendar({ onList }: { onList: () => void }) {
  const { client } = useMemberSession(); const [date, setDate] = useState(koreaDate); const month = date.slice(0, 7);
  const result = useNoticeResource(useCallback(signal => collectPages((page, token) => client.list({ kind: 'REFLECTION', month, page }, token), signal), [client, month]));
  const marked: Record<string, number> = {}; for (const row of result.data ?? []) if (row.content.date) marked[row.content.date] = (marked[row.content.date] ?? 0) + 1;
  const rows = result.data?.filter(row => row.content.date === date);
  return <AppScreen title="나의 묵상 · 캘린더" onBack={() => router.dismissTo('/my')}>
    <DayCalendar selected={date} onSelect={setDate} marked={marked} label="기록" />
    <MenuCard title="목록 보기" description="전체 기록을 기간별로 찾아보세요." onPress={onList} />
    {result.loading && <ActivityIndicator accessibilityLabel="이 달의 기록을 불러오는 중" />}
    {!!result.error && <Failure message={result.error} retry={result.reload} />}
    <Text accessibilityRole="header" style={styles.title}>{date} 묵상</Text>
    {rows?.map(row => <MenuCard key={row.id} title={row.content.kind === 'REFLECTION' ? row.content.worship.title : '나의 묵상'} description="작성됨 · 나만 보는 기록" onPress={() => router.push({ pathname: '/records/[id]', params: { id: row.id } })} />)}
    {rows && !rows.length && <Card title="이날 남긴 묵상이 없습니다">말씀에서 마음에 남은 내용을 기록해 보세요.</Card>}
    <Action title="말씀에서 묵상 시작하기" onPress={() => router.push('/devotional')} />
  </AppScreen>;
}
