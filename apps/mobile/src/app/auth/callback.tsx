import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { AppScreen, IntroCard } from '../../components/app-screen';
import { Action } from '../../components/ui';
export default function AuthCallback() {
  useEffect(() => { if (Platform.OS === 'web') WebBrowser.maybeCompleteAuthSession(); }, []);
  return <AppScreen title="로그인 확인"><IntroCard title="앱에서 로그인을 완료하고 있어요">계속 이 화면에 머무르면 로그인 화면으로 돌아가 다시 시작해 주세요.</IntroCard><Action title="로그인으로 돌아가기" onPress={() => router.replace('/login')} /></AppScreen>;
}
