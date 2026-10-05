import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { Failure, colors, styles } from '../../components/ui';
import { useChurchAbout } from '../../hooks/use-church';
export default function ChurchAbout() {
  const { data, loading, error, reload } = useChurchAbout();
  return <AppScreen title="교회소개" onBack={() => router.canGoBack() ? router.back() : router.replace('/church')}>
    {loading && <ActivityIndicator color={colors.primary} accessibilityLabel="교회 안내를 불러오는 중" />}
    {!!error && <Failure message={error} retry={reload} />}
    {data && <View style={styles.card}>
      <Text style={styles.title}>{data.title}</Text>
      <Text selectable style={styles.caption}>{[data.content.heroTitle, data.content.heroDescription, data.content.sinceLabel, data.content.motto, data.content.sectionTitle, data.content.body, ...data.content.values.map(value => `${value.title}\n${value.description}`)].filter(Boolean).join('\n\n') || '등록된 소개 내용이 없습니다.'}</Text>
    </View>}
    <MenuCard title="담임목사" onPress={() => router.push('/church-info/pastor')} />
    <MenuCard title="예배안내" onPress={() => router.push('/church-info/schedules')} />
    <MenuCard title="오시는 길" onPress={() => router.push('/church-info/location')} />
    <MenuCard title="연락처" onPress={() => router.push('/church-info/contact')} />
  </AppScreen>;
}
