import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { Check, FormField } from './form-controls';
import { accountClient, useMemberOptions } from '../hooks/use-member-options';
import { DraftGuard } from './draft-guard';

export function SignupScreen() {
  const options = useMemberOptions(); const policy = options.data?.policy;
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [accepted, setAccepted] = useState(false); const [showPolicy, setShowPolicy] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  const lock = useRef(false);
  const needsConsent = !!(policy?.terms || policy?.privacy);
  async function submit() {
    if (lock.current || !policy || !ageConfirmed) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await accountClient.signup({ email: email.trim(), password, confirm: password, displayName: '', policyVersion: policy.version, ageConfirmed: true, consent: needsConsent && accepted });
      if (result.verificationRequired !== false) { setError('이메일 확인 설정이 아직 켜져 있습니다. 교회 관리자에게 확인해 주세요.'); return; }
      setPassword(''); setDone(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : '가입하지 못했습니다. 입력 내용을 확인해 주세요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AppScreen title="회원가입" onBack={() => router.canGoBack() ? router.back() : router.replace('/login')}>
    {done ? <><Card title="가입이 완료됐어요">입력한 이메일과 비밀번호로 로그인해 주세요. 교인 확인은 MY에서 신청할 수 있어요.</Card><Action title="로그인하기" onPress={() => router.replace('/login')} /></> : <>
      <Text style={styles.title}>이메일과 비밀번호로 시작하세요</Text>
      <Text style={styles.caption}>교인 확인과 소속 신청은 가입 후 MY에서 할 수 있어요.</Text>
      {options.loading && <ActivityIndicator accessibilityLabel="가입 설정 확인 중" />}
      {!!options.error && <Failure message={options.error} retry={options.reload} />}
      <FormField label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!busy} maxLength={254} />
      <FormField label="비밀번호 · 8자 이상" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" editable={!busy} maxLength={128} />
      <Action title={showPolicy ? '약관 접기' : '이용약관·개인정보 안내'} secondary onPress={() => setShowPolicy(value => !value)} />
      {showPolicy && <View style={{ gap: 12 }}><Card title="이용약관">{policy?.terms || '등록된 내용이 없습니다.'}</Card><Card title="개인정보 안내">{policy?.privacy || '등록된 내용이 없습니다.'}</Card></View>}
      <Check label="만 14세 이상입니다 (필수)" value={ageConfirmed} onChange={setAgeConfirmed} disabled={busy} />
      <Text style={styles.caption}>만 14세 미만은 가입할 수 없어요. 공개 말씀·주보는 가입 없이 볼 수 있어요.</Text>
      {needsConsent && <Check label="이용약관 및 개인정보 안내에 동의합니다" value={accepted} onChange={setAccepted} />}
      {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
      {!options.loading && !options.error && !options.data?.registration && <Text style={styles.caption}>가입 서버 연결을 확인하고 있습니다. 잠시 후 새로고침해 주세요.</Text>}
      <Action title={busy ? '가입 중…' : '가입하기'} disabled={busy || !ageConfirmed || !options.data?.registration || (needsConsent && !accepted) || !email.trim() || password.length < 8} onPress={() => void submit()} />
    </>}
    <DraftGuard dirty={!done && !!password} busy={busy} />
  </AppScreen>;
}
