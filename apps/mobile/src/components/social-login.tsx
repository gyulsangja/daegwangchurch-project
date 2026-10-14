import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useMemberOptions } from '../hooks/use-member-options';
import { safeMemberReturn, useMemberSession } from './member-session';
import { Action, Card, styles } from './ui';
import { FormField, Check } from './form-controls';
import { ChurchRequestFields, emptyChurchDetails } from './church-request-fields';
import { churchDetailsSchema } from '@daegwang/contracts/features/member/church-membership';

export function SocialLogin({ returnTo }: { returnTo?: string }) {
  const [churchDetails, setChurchDetails] = useState(emptyChurchDetails); const [churchChecked, setChurchChecked] = useState(false);
  const options = useMemberOptions(); const { signInSocial } = useMemberSession();
  const [provider, setProvider] = useState<'google' | 'kakao' | null>(null); const [name, setName] = useState(''); const [terms, setTerms] = useState(false); const [privacy, setPrivacy] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  const policy = options.data?.policy;
  if (!options.data?.socialProviders.length || !policy) return null;
  async function login() {
    if (lock.current || !provider || !policy || !terms || !privacy) return; lock.current = true; setBusy(true); setError('');
    try { if (churchChecked && !churchDetailsSchema.safeParse(churchDetails).success) throw new Error('교인 확인에 필요한 이름·연락처·직분을 입력해 주세요.'); if (await signInSocial(provider, { displayName: name.trim(), consent: true, policyVersion: policy.version, ...(churchChecked && options.data?.churchMembership ? { churchRequest: churchDetails } : {}) })) router.replace(safeMemberReturn(returnTo)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그인하지 못했습니다.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>
    {options.data.socialProviders.map(item => <Action key={item} title={`${item === 'google' ? '구글' : '카카오'}로 시작하기`} secondary disabled={busy} onPress={() => { setProvider(item); setError(''); }} />)}
    {provider && <><Card title="처음 이용하시는 분도 함께 시작해요">SNS 인증 후 계정이 없으면 새로 만들어집니다. 교인 여부는 가입 후 별도로 확인합니다. 기존 계정이 있다면 같은 계정을 사용해 주세요.</Card>
      <FormField label="앱에서 사용할 이름" value={name} onChangeText={setName} editable={!busy} maxLength={40} />
      {options.data?.churchMembership && <ChurchRequestFields value={churchDetails} onChange={setChurchDetails} checked={churchChecked} onCheck={setChurchChecked} busy={busy} signup />}
      <Card title="이용약관">{policy.terms}</Card><Check label="이용약관에 동의합니다" value={terms} onChange={setTerms} disabled={busy} />
      <Card title="개인정보 안내">{policy.privacy}</Card><Check label="개인정보 안내에 동의합니다" value={privacy} onChange={setPrivacy} disabled={busy} />
      <Action title={busy ? '인증 중' : `${provider === 'google' ? '구글' : '카카오'} 인증으로 계속`} disabled={busy || !terms || !privacy || !name.trim()} onPress={() => void login()} />
      <Action title="취소" secondary disabled={busy} onPress={() => setProvider(null)} /></>}
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
  </>;
}
