import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen, MenuCard } from '../../components/app-screen';
import { HomeReflection } from '../../components/home-reflection';
import { HomeLive } from '../../components/home-live';
import { colors, styles } from '../../components/ui';
import { koreaDate, useLatestDevotional } from '../../hooks/use-latest-devotional';

export default function Home() {
  const { item, loading, error, reload } = useLatestDevotional();
  const today = item?.contentDate === koreaDate();
  const dateLabel = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  return <AppScreen title="대광교회" home>
    <HomeLive />
    <View style={{ gap: 6 }}><Text style={styles.caption}>{dateLabel}</Text><Text style={homeStyles.greeting}>{'잠깐이어도 괜찮아요.\n오늘도 주님과 함께.'}</Text><Text style={styles.caption}>말씀을 듣고, 마음에 남는 하나를 기도로 이어가요.</Text></View>
    <View style={homeStyles.hero}>
      <Text style={homeStyles.eyebrow}>{item && !today ? `최근 묵상 · ${item.contentDate.replaceAll('-', '.')}` : '매일의 묵상'}</Text>
      <Text style={homeStyles.heroTitle}>첫시간 주님께</Text>
      <Text accessibilityLiveRegion="polite" style={homeStyles.heroBody}>{loading ? '말씀을 불러오고 있습니다.' : error || (item ? `${item.title}${item.scriptureReference ? `\n${item.scriptureReference}` : ''}` : '공개된 묵상이 아직 없습니다.')}</Text>
      <Pressable accessibilityRole="button" disabled={loading} aria-disabled={loading} accessibilityState={{ disabled: loading }}
        onPress={() => error ? void reload() : item ? router.push({ pathname: '/devotional/[id]', params: { id: item.id } }) : router.push('/devotional')}
        style={({ pressed }) => [homeStyles.heroButton, { opacity: pressed || loading ? 0.65 : 1 }]}>
        <Text style={homeStyles.heroButtonText}>{error ? '다시 시도' : loading ? '잠시만 기다려 주세요' : item ? `${today ? '오늘의' : '최근'} 묵상 보기  →` : '묵상 목록 보기  →'}</Text>
      </Pressable>
      <View style={{ width: '100%', aspectRatio: 3.2, borderRadius: 14, overflow: 'hidden' }}><Image source={require('../../../assets/illustrations/morning-word.png')} accessible={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} resizeMode="cover" /></View>
    </View>
    {item && <HomeReflection worshipId={item.id} />}
    <View style={homeStyles.shortcuts}>
      <Pressable accessibilityRole="button" accessibilityLabel="잠시 기도하기" onPress={() => router.push('/quiet-prayer')} style={[homeStyles.shortcut, { backgroundColor: colors.soft }]}>
        <Image source={require('../../../assets/tab-icons/worship.png')} accessible={false} style={{ width: 28, height: 28 }} />
        <Text style={homeStyles.cardTitle}>잠시 기도하기</Text><Text style={styles.caption}>로그인 없이도 괜찮아요  →</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="나의 기록" onPress={() => router.navigate('/my')} style={homeStyles.shortcut}>
        <Image source={require('../../../assets/tab-icons/church.png')} accessible={false} style={{ width: 28, height: 28 }} />
        <Text style={homeStyles.cardTitle}>나의 기록</Text><Text style={styles.caption}>묵상과 기도를 다시 읽어요  →</Text>
      </Pressable>
    </View>
    <Text accessibilityRole="header" style={[styles.title, { marginTop: 12 }]}>이번 주 교회생활</Text>
    <MenuCard title="주보 보기" description="예배 순서와 교회 소식을 함께 확인해요." onPress={() => router.push('/bulletins')} />
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/news')} style={homeStyles.card}>
      <Text style={homeStyles.cardTitle}>교회 소식</Text><Text style={styles.caption}>공지 · 주보 · 공동기도</Text>
    </Pressable>
    <MenuCard title="도움이 필요하신가요?" description="앱 사용 안내 · 처음 시작하는 분께" onPress={() => router.push('/help')} />
  </AppScreen>;
}

const homeStyles = StyleSheet.create({
  greeting: { fontFamily: 'NotoSansKR_700Bold', fontSize: 26, lineHeight: 38, color: colors.text },
  hero: { backgroundColor: '#fbf7ef', borderWidth: 1, borderColor: '#e9e0d0', padding: 16, borderRadius: 20, gap: 12 },
  eyebrow: { fontFamily: 'NotoSansKR_700Bold', fontSize: 14, lineHeight: 21, color: colors.muted },
  heroTitle: { fontFamily: 'NotoSansKR_700Bold', fontSize: 28, lineHeight: 41, color: colors.text },
  heroBody: { fontFamily: 'NotoSansKR_400Regular', fontSize: 16, lineHeight: 24, color: colors.text },
  heroButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, minHeight: 52, justifyContent: 'center' },
  heroButtonText: { fontFamily: 'NotoSansKR_700Bold', fontSize: 16, lineHeight: 24, color: colors.surface, textAlign: 'center' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shortcut: { flex: 1, minWidth: 140, backgroundColor: colors.surface, borderRadius: 20, padding: 16, gap: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 8 },
  cardTitle: { fontFamily: 'NotoSansKR_700Bold', fontSize: 18, lineHeight: 26, color: colors.text },
});
