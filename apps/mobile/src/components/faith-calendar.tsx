import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { z } from 'zod';
import { collectPages } from '@daegwang/api-client/pagination';
import { useMemberSession } from './member-session';
import { AppScreen, MenuCard } from './app-screen';
import { DayCalendar } from './day-calendar';
import { Action, Card, Failure, styles } from './ui';
import { useNoticeResource } from '../hooks/use-notices';
import { koreaDate } from '../hooks/use-latest-devotional';
import { worshipClient } from '../lib/api';

export function FaithCalendar({ initialDate, onList }: { initialDate?: string; onList: () => void }) {
  const { client } = useMemberSession(); const [date, setDate] = useState(() => z.iso.date().safeParse(initialDate).data ?? koreaDate()); const month = date.slice(0, 7);
  const result = useNoticeResource(useCallback(signal => collectPages((page, token) => client.list({ month, page }, token), signal), [client, month]));
  const word = useNoticeResource(useCallback(signal => worshipClient.list({ type: 'FIRST_HOUR', from: date, to: date, signal }), [date]));
  const marked: Record<string, number> = {}; for (const row of result.data ?? []) if (row.content.date) marked[row.content.date] = (marked[row.content.date] ?? 0) + 1;
  const rows = result.data?.filter(row => row.content.date === date) ?? [];
  const reflections = rows.filter(row => row.content.kind === 'REFLECTION'); const prayers = rows.filter(row => row.content.kind === 'PRAYER'); const topics = rows.filter(row => row.content.kind === 'SPECIAL_PRAYER');
  const reflection = reflections[0]; const selectedWord = word.data?.data[0];
  const linkedWord = reflection?.content.kind === 'REFLECTION' ? reflection.content.worship : selectedWord;
  return <AppScreen title="말씀 · 묵상 · 기도" onBack={() => router.dismissTo('/my')}>
    <MenuCard title="기도제목별 보기" description="여러 날에 걸쳐 이어가는 기도" onPress={() => router.push({ pathname: '/records', params: { kind: 'SPECIAL_PRAYER' } })} />
    <DayCalendar selected={date} onSelect={setDate} marked={marked} label="기록" />
    <Text accessibilityRole="header" style={styles.title}>{date.replaceAll('-', '.')} · 나의 하루</Text>
    <Text style={styles.caption}>말씀에서 마음에 남은 묵상과 기도를 함께 남겨요. 나만 볼 수 있습니다.</Text>
    {result.loading && <ActivityIndicator accessibilityLabel="이 달의 기록을 불러오는 중" />}
    {!!result.error && <Failure message={result.error} retry={result.reload} />}
    <Text accessibilityRole="header" style={styles.title}>1. 말씀</Text>
    {linkedWord ? <MenuCard title={linkedWord.title} description="말씀 영상 보기" onPress={() => router.push({ pathname: '/devotional/[id]', params: { id: linkedWord.id } })} /> : word.loading ? <ActivityIndicator accessibilityLabel="이날의 말씀을 불러오는 중" /> : word.error ? <Failure message={word.error} retry={word.reload} /> : <Card title="이날의 첫시간 영상이 없습니다">기도는 말씀 영상이나 묵상 기록 없이도 남길 수 있어요.</Card>}
    <Text accessibilityRole="header" style={styles.title}>2. 묵상</Text>
    {reflections.map(row => <MenuCard key={row.id} title="이날의 묵상 · 이어 쓰기" description={row.content.body.slice(0, 140)} onPress={() => router.push({ pathname: '/records/edit/[id]', params: { id: row.id } })} />)}
    {!reflections.length && <Action title="이날의 묵상 남기기" disabled={result.loading || !!result.error || !selectedWord} onPress={() => selectedWord && router.push({ pathname: '/records/new', params: { kind: 'REFLECTION', worshipId: selectedWord.id, date } })} />}
    <Text accessibilityRole="header" style={styles.title}>3. 기도</Text>
    {prayers.map(row => <MenuCard key={row.id} title={row.content.title || '이날의 기도'} description={row.content.body.slice(0, 140)} onPress={() => router.push({ pathname: '/records/[id]', params: { id: row.id } })} />)}
    {!prayers.length && !result.loading && !result.error && <Text style={styles.caption}>말씀 앞에서 드리고 싶은 기도를 남겨보세요.</Text>}
    <Action title="이날의 기도 남기기" disabled={result.loading || !!result.error} onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER', date, ...(reflection ? { reflectionId: reflection.id } : {}) } })} />
    {topics.map(row => <MenuCard key={row.id} title={`시작한 기도제목 · ${row.content.title}`} onPress={() => router.push({ pathname: '/records/[id]', params: { id: row.id } })} />)}
    <MenuCard title="계속 품을 기도제목 만들기" description="하나의 제목에 여러 날의 기도를 이어가요." onPress={() => router.push({ pathname: '/records/new', params: { kind: 'SPECIAL_PRAYER', date, ...(reflection ? { reflectionId: reflection.id } : {}) } })} />
    <MenuCard title="전체 기록 목록" onPress={onList} />
  </AppScreen>;
}
