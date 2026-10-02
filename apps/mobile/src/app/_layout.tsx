import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
import { colors, Loading } from '../components/ui';

export default function Layout() {
  const [loaded, error] = useFonts({ NotoSansKR_400Regular, NotoSansKR_700Bold });
  if (!loaded && !error) return <Loading />;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: 'NotoSansKR_700Bold', fontSize: 22 }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="index" options={{ title: '첫시간 주님께 목록' }} />
    <Stack.Screen name="devotional/[id]" options={{ title: '첫시간 주님께', headerBackTitle: '목록' }} />
  </Stack></>;
}
