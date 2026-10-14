import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../../components/app-screen';
import { HomeLive } from '../../components/home-live';
import { WorshipSkeleton } from '../../components/worship-skeleton';
import { VideoThumbnail } from '../../components/video-thumbnail';
import { colors, styles } from '../../components/ui';
import { koreaDate, useLatestDevotional } from '../../hooks/use-latest-devotional';

export default function Home() {
  const { item, loading, error, reload } = useLatestDevotional();
  const today = item?.contentDate === koreaDate();
  const shortcuts = [
    { title: '주보', hint: '예배 순서', route: '/bulletins' as const, icon: require('../../../assets/tab-icons/news.png') },
    { title: '설교', hint: '말씀 다시 듣기', route: '/sermons' as const, icon: require('../../../assets/tab-icons/worship.png') },
    { title: '기도', hint: '잠시 기도하기', route: '/quiet-prayer' as const, icon: require('../../../assets/tab-icons/church.png') },
    { title: '나의 기록', hint: '묵상과 기도', route: '/my' as const, icon: require('../../../assets/tab-icons/my.png') },
  ];
  return <AppScreen title="대광교회" home>
    <HomeLive />
    <View style={home.hero}>
      <View style={home.row}><Text style={home.eyebrow}>첫시간 주님께</Text><Pressable accessibilityRole="button" onPress={() => router.push('/devotional')} style={home.smallButton}><Text style={home.link}>전체 보기 ›</Text></Pressable></View>
      {loading && !item ? <WorshipSkeleton /> : item ? <>
        <Text style={home.date}>{item.contentDate.replaceAll('-', '.')} · {today ? '오늘의 묵상' : '최근 묵상'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${item.title} 묵상 보기`} onPress={() => router.push({ pathname: '/devotional/[id]', params: { id: item.id } })} style={home.feature}>
          <View style={{ width: 100 }}><VideoThumbnail videoId={item.youtube.videoId} /></View>
          <View style={{ flex: 1, gap: 6 }}><Text style={home.title}>{item.title}</Text>{!!item.scriptureReference && <Text style={styles.caption}>{item.scriptureReference}</Text>}</View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/devotional/[id]', params: { id: item.id } })} style={home.cta}><Text style={home.ctaText}>말씀 듣고 묵상하기 →</Text></Pressable>
      </> : <Text style={styles.caption}>{error || '공개된 묵상이 아직 없습니다.'}</Text>}
      {!!error && <Pressable accessibilityRole="button" onPress={() => void reload()} style={home.smallButton}><Text style={home.link}>다시 불러오기</Text></Pressable>}
    </View>
    <View style={home.grid}>{shortcuts.map(shortcut => <Pressable key={shortcut.route} accessibilityRole="button" accessibilityLabel={shortcut.title} onPress={() => router.navigate(shortcut.route)} style={home.shortcut}>
      <Image source={shortcut.icon} style={{ width: 25, height: 25 }} accessible={false} /><View style={{ flex: 1 }}><Text style={home.shortcutTitle}>{shortcut.title}</Text><Text style={home.hint}>{shortcut.hint}</Text></View>
    </Pressable>)}</View>
    <View style={home.links}><Pressable accessibilityRole="button" onPress={() => router.navigate('/news')} style={home.listLink}><Text style={home.shortcutTitle}>교회·모임 소식</Text><Text style={home.link}>공지와 일정 ›</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.push('/church-info/location')} style={home.listLink}><Text style={home.shortcutTitle}>오시는 길</Text><Text style={home.link}>지도 보기 ›</Text></Pressable></View>
  </AppScreen>;
}
const home = StyleSheet.create({
  hero: { backgroundColor: '#fbf7ef', borderWidth: 1, borderColor: '#e9e0d0', padding: 16, borderRadius: 18, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: 'NotoSansKR_700Bold', fontSize: 15, color: colors.primary },
  date: { fontFamily: 'NotoSansKR_700Bold', fontSize: 14, lineHeight: 21, color: colors.muted },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 78 },
  title: { fontFamily: 'NotoSansKR_700Bold', fontSize: 23, lineHeight: 33, color: colors.text },
  cta: { backgroundColor: colors.primary, borderRadius: 12, minHeight: 48, padding: 10, justifyContent: 'center' },
  ctaText: { color: colors.surface, fontSize: 16, fontFamily: 'NotoSansKR_700Bold', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shortcut: { flexBasis: '47%', flexGrow: 1, minHeight: 78, backgroundColor: colors.surface, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  shortcutTitle: { fontFamily: 'NotoSansKR_700Bold', fontSize: 16, lineHeight: 24, color: colors.text },
  hint: { fontFamily: 'NotoSansKR_400Regular', fontSize: 12, lineHeight: 19, color: colors.muted },
  links: { backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14 },
  listLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, gap: 10 },
  smallButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  link: { color: colors.primary, fontFamily: 'NotoSansKR_700Bold', fontSize: 13 },
});
