import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { createEventClient } from '@daegwang/api-client/events';
import { collectPages } from '@daegwang/api-client/pagination';
import { eventOnDay, monthDates } from '@daegwang/contracts/features/calendar';
import { AppScreen, MenuCard } from '../components/app-screen';
import { Card, Failure, styles } from '../components/ui';
import { DayCalendar } from '../components/day-calendar';
import { useNoticeResource } from '../hooks/use-notices';
import { eventDate } from '../hooks/use-events';
import { koreaDate } from '../hooks/use-latest-devotional';
const client = createEventClient(process.env.EXPO_PUBLIC_API_BASE_URL);
export default function ChurchCalendar() {
  const [selected, setSelected] = useState(koreaDate); const month = selected.slice(0, 7);
  const { data, loading, error, reload } = useNoticeResource(useCallback(signal => collectPages((page, token) => client.list(page, 'upcoming', token, undefined, month), signal), [month]));
  const marked = Object.fromEntries(monthDates(month).map(date => [date, data?.filter(event => eventOnDay(event, date)).length ?? 0]));
  const rows = data?.filter(event => eventOnDay(event, selected));
  return <AppScreen title="교회 일정" onBack={() => router.canGoBack() ? router.back() : router.replace('/news')}>
    <DayCalendar selected={selected} onSelect={setSelected} marked={marked} />
    <MenuCard title="목록 보기" onPress={() => router.push('/events')} />
    <Text accessibilityRole="header" style={styles.title}>{selected} 일정</Text>
    {loading && <ActivityIndicator accessibilityLabel="일정을 불러오는 중" />}{!!error && <Failure message={error} retry={reload} />}
    {rows?.map(item => <MenuCard key={item.id} title={item.title} description={`${eventDate(item)}\n${item.location || '장소 안내 예정'}`} onPress={() => router.push({ pathname: '/events/[id]', params: { id: item.id } })} />)}
    {rows && !rows.length && <Card title="등록된 일정이 없습니다">선택한 날짜에 공개된 교회 행사가 없습니다.</Card>}
    <Card title="교회 공식 일정">관리자가 공개한 행사 일정입니다.</Card><MenuCard title="나의 일정으로 보기" description="회원 기능" onPress={() => router.push('/schedules')} />
  </AppScreen>;
}
