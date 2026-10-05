import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Card, Failure, colors, styles } from '../../components/ui';
import { eventDate, useChurchEvent } from '../../hooks/use-events';
import { SaveEventButton } from '../../components/save-event-button';
export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload } = useChurchEvent(typeof id === 'string' ? id : '');
  return <AppScreen title="행사 상세" onBack={() => router.canGoBack() ? router.back() : router.replace('/events')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="행사를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <>
      <Card title={data.title}>{eventDate(data)}{'\n'}{data.location || '장소 안내 예정'}{data.ministryName ? ` · ${data.ministryName}` : ''}</Card>
      <View style={styles.card}><Text style={styles.title}>행사 안내</Text><Text selectable style={styles.caption}>{data.description || '자세한 안내를 준비하고 있습니다.'}</Text></View>
      <SaveEventButton eventId={data.id} />
      <MenuCard title="문의하기" description="교회 연락처" onPress={() => router.push('/church-info/contact')} />
    </>}
    <MenuCard title="행사 목록" onPress={() => router.replace('/events')} />
  </AppScreen>;
}
