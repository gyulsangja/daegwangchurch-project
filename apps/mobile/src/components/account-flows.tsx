import { useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { emailSchema, signupSchema, resetPasswordSchema } from '@daegwang/contracts/features/member/extras';
import { AppScreen, IntroCard, MenuCard } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { Check, FormField } from './form-controls';
import { DraftGuard } from './draft-guard';
import { accountClient, useMemberOptions } from '../hooks/use-member-options';

export function SignupScreen() {
  const options = useMemberOptions(); const [step, setStep] = useState<'form' | 'terms' | 'verify' | 'complete'>('form');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [displayName, setDisplayName] = useState(''); const [terms, setTerms] = useState(false); const [privacy, setPrivacy] = useState(false); const [code, setCode] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const policy = options.data?.policy;
  async function run(action: () => Promise<void>) { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage(''); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : '처리하지 못했습니다.'); } finally { lock.current = false; setBusy(false); } }
  async function submit() {
    const parsed = signupSchema.safeParse({ email, password, confirm, displayName, policyVersion: policy?.version ?? '', consent: terms && privacy });
    if (!parsed.success) { setError('이메일, 8자 이상의 비밀번호와 일치 여부, 필수 동의를 확인해 주세요.'); return; }
    await accountClient.signup(parsed.data); setPassword(''); setConfirm(''); setStep('verify');
  }
  const back = () => { if (step === 'terms') setStep('form'); else if (router.canGoBack()) router.back(); else router.replace('/login'); };
  return <AppScreen title={step === 'terms' ? '약관 및 개인정보 동의' : step === 'verify' ? '가입 인증 및 완료' : step === 'complete' ? '회원가입 완료' : '회원가입'} onBack={back}>
    {options.loading && <ActivityIndicator accessibilityLabel="가입 안내를 불러오는 중" />}{!!options.error && <Failure message={options.error} retry={options.reload} />}
    {options.data?.mode === 'preview' && <IntroCard title="테스트 가입">가상의 @example.invalid 이메일을 사용하세요. 메일은 발송하지 않으며 테스트 인증번호는 123456입니다.</IntroCard>}
    {options.data && !options.data.registration && <IntroCard title="가입 준비 중">실제 이용약관과 개인정보 안내가 확정되면 가입할 수 있습니다. 입력은 전송되지 않습니다.</IntroCard>}
    {step === 'form' && <>
      <FormField label="이메일" value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" keyboardType="email-address" maxLength={254} />
      <FormField label="비밀번호" value={password} onChangeText={setPassword} editable={!busy} secureTextEntry maxLength={128} autoCapitalize="none" />
      <Text style={styles.caption}>{options.data?.mode === 'preview' ? '개발 검증 기준: 8자 이상.' : '8자 이상의 비밀번호를 사용해 주세요. 다른 사이트와 같은 비밀번호는 피해주세요.'}</Text>
      <FormField label="비밀번호 확인" value={confirm} onChangeText={setConfirm} editable={!busy} secureTextEntry maxLength={128} autoCapitalize="none" />
      <FormField label="표시 이름 · 선택" value={displayName} onChangeText={setDisplayName} editable={!busy} maxLength={40} />
      <MenuCard title="필수 약관 확인" description={terms && privacy ? '안내 확인함' : '동의 내용을 먼저 확인해 주세요.'} onPress={() => setStep('terms')} />
      <Action title={busy ? '처리 중' : '다음'} disabled={busy || !options.data?.registration || !policy} onPress={() => void run(submit)} />
    </>}
    {step === 'terms' && <>
      <Card title="이용약관">{policy?.terms ?? '실제 이용약관은 확정 전입니다.'}</Card><Check label="[필수] 이용약관 확인" value={terms} onChange={setTerms} disabled={!policy} />
      <Card title="개인정보 수집·이용">{policy?.privacy ?? '수집 항목과 보관 기준은 확정 전입니다.'}</Card><Check label="[필수] 개인정보 안내 확인" value={privacy} onChange={setPrivacy} disabled={!policy} />
      <Card title="선택 알림">알림은 가입 필수 조건이 아닙니다. 가입 후 알림 설정에서 별도로 선택합니다.</Card>
      <Action title="동의하고 돌아가기" disabled={!terms || !privacy || !policy} onPress={() => setStep('form')} />
    </>}
    {step === 'verify' && <>
      <IntroCard title="이메일을 확인해 주세요">{email}{'\n'}{options.data?.mode === 'preview' ? '개발 체험 인증번호는 123456입니다.' : '메일에 적힌 인증번호를 입력해 주세요. 메일이 없으면 스팸함도 확인해 주세요.'}</IntroCard>
      <FormField label="인증번호" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={8} editable={!busy} />
      <Action title="인증 완료 확인" disabled={busy || !/^\d{6,8}$/.test(code)} onPress={() => void run(async () => { await accountClient.verify(email, code); setCode(''); setStep('complete'); })} />
      <Action title="인증 메일 다시 보내기" disabled={busy} onPress={() => void run(async () => { await accountClient.resend(email); setMessage(options.data?.mode === 'preview' ? '요청을 처리했습니다. 테스트 인증번호는 123456입니다.' : '요청을 처리했습니다. 메일을 확인해 주세요.'); })} />
      <MenuCard title="이메일 수정" description="가입 입력 화면으로 돌아갑니다." onPress={() => { setCode(''); setStep('form'); }} />
    </>}
    {step === 'complete' && <><IntroCard title={options.data?.mode === 'preview' ? '테스트 가입을 완료했습니다' : '가입을 완료했습니다'}>입력한 이메일과 비밀번호로 로그인할 수 있습니다.</IntroCard><Action title="로그인으로 이동" onPress={() => router.replace('/login')} /></>}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.caption}>{message}</Text>}{!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
    <DraftGuard dirty={(step === 'form' || step === 'terms') && !!(email || password || displayName)} busy={busy} />
  </AppScreen>;
}

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
