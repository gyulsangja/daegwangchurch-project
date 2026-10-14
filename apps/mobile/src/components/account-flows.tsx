import { useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { emailSchema, resetPasswordSchema } from '@daegwang/contracts/features/member/extras';
import { AppScreen, IntroCard, MenuCard } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { FormField } from './form-controls';
import { DraftGuard } from './draft-guard';
import { accountClient, useMemberOptions } from '../hooks/use-member-options';

export { SignupScreen } from './simple-signup';

export function RecoveryScreen() {
  const options = useMemberOptions(); const [step, setStep] = useState<'email' | 'reset' | 'done'>('email'); const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  async function run() { if (lock.current) return; setError(''); const valid = step === 'email' ? emailSchema.safeParse(email).success : resetPasswordSchema.safeParse({ email, code, password, confirm }).success; if (!valid) { setError('이메일, 인증번호 또는 비밀번호 입력을 확인해 주세요.'); return; } lock.current = true; setBusy(true);
    try { if (step === 'email') { await accountClient.recover(email); setStep('reset'); } else { await accountClient.reset({ email, code, password, confirm }); setPassword(''); setConfirm(''); setCode(''); setStep('done'); } } catch (cause) { setError(cause instanceof Error ? cause.message : '처리하지 못했습니다.'); } finally { lock.current = false; setBusy(false); }
  }
  return <AppScreen title={step === 'reset' ? '비밀번호 재설정' : '비밀번호 찾기'} onBack={() => router.canGoBack() ? router.back() : router.replace('/login')}>
    {options.loading && <ActivityIndicator accessibilityLabel="계정 안내를 불러오는 중" />}{!!options.error && <Failure message={options.error} retry={options.reload} />}
    {options.data?.mode === 'preview' && <IntroCard title="테스트 계정 복구">메일은 발송하지 않습니다. @example.invalid 주소와 테스트 인증번호 123456을 사용하세요.</IntroCard>}
    {options.data && !options.data.recovery && <Card title="복구 연결 준비 중">메일 발송과 인증 설정을 준비하고 있습니다.</Card>}
    {step === 'email' && <><FormField label="가입 이메일" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!busy} maxLength={254} /><Action title="재설정 안내 받기" disabled={busy || !options.data?.recovery} onPress={() => void run()} /></>}
    {step === 'reset' && <>
      <IntroCard title="안내를 요청했습니다">등록된 계정이면 안내를 받을 수 있습니다. 계정 존재 여부는 표시하지 않습니다.</IntroCard>
      <FormField label="인증번호" value={code} onChangeText={setCode} maxLength={8} keyboardType="number-pad" editable={!busy} />
      <FormField label="새 비밀번호" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} editable={!busy} />
      <FormField label="새 비밀번호 확인" value={confirm} onChangeText={setConfirm} secureTextEntry maxLength={128} editable={!busy} />
      <Action title="비밀번호 변경" disabled={busy} onPress={() => void run()} />
      <MenuCard title="인증번호가 만료되었나요?" description="재설정 안내 다시 받기" onPress={() => { setCode(''); setStep('email'); }} />
    </>}
    {step === 'done' && <><IntroCard title="재설정 요청을 처리했습니다">새 비밀번호로 다시 로그인해 주세요.</IntroCard><Action title="로그인으로 이동" onPress={() => router.replace('/login')} /></>}
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}<DraftGuard dirty={!!password && step !== 'done'} busy={busy} />
  </AppScreen>;
}
