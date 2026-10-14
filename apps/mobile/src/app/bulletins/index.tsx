import { MonthPicker } from '../../components/date-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, colors, styles } from '../../components/ui';
import { useBulletinList } from '../../hooks/use-bulletins';
import { noticeDate } from '../../hooks/use-notices';

export default function BulletinList() {
  const [page, setPage] = useState(0);
  const [month, setMonth] = useState('');
  const { data, loading, error, reload } = useBulletinList(page, month);
  return <AppScreen title="주보 목록" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={[styles.caption, { flex: 1 }]}>공개된 주보를 30초마다 확인해요.</Text><Pressable accessibilityRole="button" accessibilityLabel="주보 새로고침" disabled={loading} onPress={() => void reload()} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}><Text style={{ color: colors.primary, fontWeight: '700' }}>새로고침</Text></Pressable></View>
    <MonthPicker label="주보 조회 연월" value={month} onChange={value => { setMonth(value); setPage(0); }} />
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="주보를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      {!data.data.length && <Card title="등록된 주보가 없습니다">기간을 변경하거나 나중에 다시 확인해 주세요.</Card>}
      {data.data.map(item => <MenuCard key={item.id} title={item.title} description={`${noticeDate(item.worshipDate)} · PDF`} onPress={() => router.push({ pathname: '/bulletins/[id]', params: { id: item.id } })} />)}
      {data.nextPage !== null && <Action title="다음 주보" onPress={() => setPage(data.nextPage!)} />}
    </>}
    {!loading && page > 0 && <Action title="이전 주보" onPress={() => setPage(value => value - 1)} />}
  </AppScreen>;
}
