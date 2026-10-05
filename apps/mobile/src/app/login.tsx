import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { AppScreen, IntroCard, MenuCard } from '../components/app-screen';
import { Action, styles } from '../components/ui';
import { safeMemberReturn, useMemberSession } from '../components/member-session';

export default function Login() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { configured, signIn } = useMemberSession();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit() {
    if (busy) return;
    if (!z.email().safeParse(email.trim()).success || !password) { setError('이메일과 비밀번호를 입력해 주세요.'); return; }
    setBusy(true); setError('');
    try { await signIn(email, password); setPassword(''); router.dismissTo(safeMemberReturn(returnTo)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그인하지 못했습니다.'); }
    finally { setBusy(false); }
  }
  return <AppScreen title="로그인" onBack={() => router.canGoBack() ? router.back() : router.replace('/my')}>
    <IntroCard title="신앙생활 기록을 이어가세요">로그인 후 요청하신 화면으로 돌아갑니다.</IntroCard>
    {!configured && <IntroCard title="로그인 연결 준비 중">공개 말씀과 교회 안내는 로그인 없이 이용할 수 있습니다.</IntroCard>}
    <Text style={styles.caption}>이메일</Text><TextInput accessibilityLabel="이메일" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} style={styles.input} maxLength={254} />
    <Text style={styles.caption}>비밀번호</Text><TextInput accessibilityLabel="비밀번호" autoCapitalize="none" autoCorrect={false} autoComplete="current-password" secureTextEntry={!visible} value={password} onChangeText={setPassword} style={styles.input} maxLength={1024} onSubmitEditing={() => void submit()} />
    <MenuCard title={visible ? '비밀번호 숨기기' : '비밀번호 보기'} onPress={() => setVisible(!visible)} />
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
    <Action title={busy ? '로그인 중' : '로그인'} onPress={() => void submit()} disabled={busy || !configured} />
    {process.env.EXPO_PUBLIC_DEMO_MODE === 'true' && <MenuCard title="테스트 계정 채우기" description="실제 정보 없이 회원 기능을 체험합니다." onPress={() => { setEmail('demo@example.invalid'); setPassword('Demo-only-123!'); }} />}
    <MenuCard title="비밀번호 찾기" onPress={() => router.push('/recover')} />
    <MenuCard title="회원가입" onPress={() => router.push('/signup')} />
    <Text style={styles.caption}>현재 로그인은 앱을 종료하거나 웹을 새로고침하면 해제됩니다.</Text>
    <MenuCard title="로그인하지 않고 계속 보기" onPress={() => router.replace('/')} />
  </AppScreen>;
}
