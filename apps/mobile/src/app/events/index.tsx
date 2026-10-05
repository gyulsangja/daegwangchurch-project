import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, colors, styles } from '../../components/ui';
import { eventDate, useEventList } from '../../hooks/use-events';
export default function EventList() {
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState<'upcoming' | 'past'>('upcoming');
  const { data, loading, error, reload } = useEventList(page, period);
  return <AppScreen title="행사 목록" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    <View style={{ backgroundColor: colors.soft, borderRadius: 12, flexDirection: 'row', paddingHorizontal: 10 }}>
      {(['upcoming', 'past'] as const).map(value => <Pressable key={value} accessibilityRole="tab" aria-selected={value === period} accessibilityState={{ selected: value === period }} onPress={() => { setPeriod(value); setPage(0); }} style={{ minHeight: 48, paddingHorizontal: 10, justifyContent: 'center' }}><Text style={value === period ? styles.title : styles.caption}>{value === 'upcoming' ? '예정' : '지난 행사'}</Text></Pressable>)}
    </View>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="행사를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      {!data.data.length && <Card title="등록된 행사가 없습니다">공개된 행사 안내가 등록되면 확인할 수 있어요.</Card>}
      {data.data.map(item => <MenuCard key={item.id} title={item.title} description={`${eventDate(item)}\n${item.location || '장소 안내 예정'}`} onPress={() => router.push({ pathname: '/events/[id]', params: { id: item.id } })} />)}
      {data.nextPage !== null && <Action title="다음 행사" onPress={() => setPage(data.nextPage!)} />}
    </>}
    {!loading && page > 0 && <Action title="이전 행사" onPress={() => setPage(value => value - 1)} />}
  </AppScreen>;
}
