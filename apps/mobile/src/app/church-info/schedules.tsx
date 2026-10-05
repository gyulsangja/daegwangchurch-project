import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Card, Failure, colors } from '../../components/ui';
import { useChurchSchedules } from '../../hooks/use-church';
export default function ChurchSchedules() {
  const { data, loading, error, reload } = useChurchSchedules();
  return <AppScreen title="예배안내" onBack={() => router.canGoBack() ? router.back() : router.replace('/church')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="예배 안내를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && (!data.length ? <Card title="등록된 예배 안내가 없습니다">공식 예배 시간표가 등록되면 확인할 수 있어요.</Card> : data.map(item => <Card key={item.id} title={item.name}>{`${item.dayLabel} · ${item.timeLabel}\n${item.location || '장소 안내 예정'}${item.note ? `\n${item.note}` : ''}`}</Card>))}
    <MenuCard title="오시는 길" onPress={() => router.push('/church-info/location')} />
    <MenuCard title="예배 문의" onPress={() => router.push('/church-info/contact')} />
  </AppScreen>;
}
