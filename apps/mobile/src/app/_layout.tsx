import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
import { colors } from '../components/ui';
import { FeatureNoticeProvider } from '../components/app-screen';
import { MemberSessionProvider } from '../components/member-session';
import { PushNotificationBridge } from '../components/push-notifications';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Layout() {
  const [loaded, error] = useFonts({ NotoSansKR_400Regular, NotoSansKR_700Bold });
  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync().catch(() => {}); }, [loaded, error]);
  if (!loaded && !error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: colors.background }}><Image source={require('../../assets/figma/church-mark.png')} style={{ width: 48, height: 57 }} accessibilityLabel="대광교회" /><ActivityIndicator accessibilityLabel="앱을 준비하는 중" color={colors.primary} /><Text style={{ color: colors.text, fontSize: 16 }}>앱을 준비하고 있습니다.</Text></View>;
  return <MemberSessionProvider><FeatureNoticeProvider><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text,
    headerTitleStyle: { fontFamily: 'NotoSansKR_700Bold', fontSize: 22 }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="login" options={{ headerShown: false }} />
    <Stack.Screen name="help" options={{ headerShown: false }} />
    <Stack.Screen name="quiet-prayer" options={{ headerShown: false }} />
    <Stack.Screen name="groups" options={{ headerShown: false }} />
    <Stack.Screen name="signup" options={{ headerShown: false }} />
    <Stack.Screen name="recover" options={{ headerShown: false }} />
    <Stack.Screen name="care/index" options={{ headerShown: false }} />
    <Stack.Screen name="care/new" options={{ headerShown: false }} />
    <Stack.Screen name="care/requests" options={{ headerShown: false }} />
    <Stack.Screen name="care/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
    <Stack.Screen name="notifications/settings" options={{ headerShown: false }} />
    <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="account/index" options={{ headerShown: false }} />
    <Stack.Screen name="account/privacy" options={{ headerShown: false }} />
    <Stack.Screen name="account/delete" options={{ headerShown: false }} />
    <Stack.Screen name="account/deletion-received" options={{ headerShown: false }} />
    <Stack.Screen name="saved-worship" options={{ headerShown: false }} />
    <Stack.Screen name="schedules/index" options={{ headerShown: false }} />
    <Stack.Screen name="schedules/new" options={{ headerShown: false }} />
    <Stack.Screen name="schedules/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="schedules/edit/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="records/index" options={{ headerShown: false }} />
    <Stack.Screen name="records/new" options={{ headerShown: false }} />
    <Stack.Screen name="records/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="records/edit/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="sermons/index" options={{ headerShown: false }} />
    <Stack.Screen name="sermons/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="worship-search" options={{ headerShown: false }} />
    <Stack.Screen name="church-calendar" options={{ headerShown: false }} />
    <Stack.Screen name="notices/index" options={{ headerShown: false }} />
    <Stack.Screen name="prayers/index" options={{ headerShown: false }} />
    <Stack.Screen name="prayers/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="bulletins/index" options={{ headerShown: false }} />
    <Stack.Screen name="events/index" options={{ headerShown: false }} />
    <Stack.Screen name="church-info/about" options={{ headerShown: false }} />
    <Stack.Screen name="church-info/pastor" options={{ headerShown: false }} />
    <Stack.Screen name="church-info/newcomer" options={{ headerShown: false }} />
    <Stack.Screen name="church-info/location" options={{ headerShown: false }} />
    <Stack.Screen name="church-info/contact" options={{ headerShown: false }} />
    <Stack.Screen name="church-info/schedules" options={{ headerShown: false }} />
    <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="bulletins/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="notices/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="devotional/index" options={{ title: '첫시간 주님께 목록', headerBackTitle: '뒤로' }} />
    <Stack.Screen name="devotional/[id]" options={{ title: '첫시간 주님께', headerBackTitle: '뒤로' }} />
  </Stack><PushNotificationBridge /></FeatureNoticeProvider></MemberSessionProvider>;
}
