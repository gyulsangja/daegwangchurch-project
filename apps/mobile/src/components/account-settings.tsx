import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { MemberGate, useMemberSession } from './member-session';
import { AppScreen, IntroCard, MenuCard, useFeatureNotice } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { Check, FormField } from './form-controls';
import { ConfirmDialog } from './confirm-dialog';
import { DraftGuard } from './draft-guard';
import { useNoticeResource } from '../hooks/use-notices';
import { useMemberOptions } from '../hooks/use-member-options';

export function AccountScreen() { return <MemberGate returnTo="/account"><Account /></MemberGate>; }
function Account() {
  const { extras, session, signOut } = useMemberSession(); const notice = useFeatureNotice();
  const [name, setName] = useState(''); const [original, setOriginal] = useState(''); const [version, setVersion] = useState(0); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const result = useNoticeResource(useCallback(async signal => { const data = await extras.profile(signal); if (!signal.aborted) { setName(data.displayName); setOriginal(data.displayName); setVersion(data.version); } return data; }, [extras]));
  async function save() { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage(''); try { const data = await extras.saveProfile(name, version); setName(data.displayName); setOriginal(data.displayName); setVersion(data.version); setMessage('표시 이름을 저장했습니다.'); } catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다.'); } finally { lock.current = false; setBusy(false); } }
  return <AppScreen title="계정관리" onBack={() => router.dismissTo('/my')}>
    <Card title="내 계정">{session?.user.email ?? ''}</Card>{result.loading && <ActivityIndicator accessibilityLabel="계정을 불러오는 중" />}{!!result.error && <Failure message={result.error} retry={result.reload} />}
    {result.data && <><FormField label="표시 이름 · 선택" value={name} onChangeText={setName} maxLength={40} editable={!busy} /><Action title="표시 이름 저장" disabled={busy || name === original} onPress={() => void save()} /></>}
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}{!!message && <Text accessibilityLiveRegion="polite" style={styles.caption}>{message}</Text>}
    <MenuCard title="비밀번호 변경" description="이메일 인증 후 재설정" onPress={() => router.push('/recover')} />
    <MenuCard title="개인정보 설정" onPress={() => router.push('/account/privacy')} />
    <MenuCard title="로그아웃" description="기기 내 개인 기록 표시 종료" onPress={() => { void signOut().catch(cause => notice('로그아웃 안내', cause.message)); }} />
    <MenuCard title="회원탈퇴" description="안내 및 확인" onPress={() => router.push('/account/delete')} />
    <DraftGuard dirty={!!result.data && name !== original} busy={busy} />
  </AppScreen>;
}
export function PrivacyScreen() { return <MemberGate returnTo="/account/privacy"><Privacy /></MemberGate>; }
function Privacy() {
  const { extras } = useMemberSession(); const options = useMemberOptions(); const profile = useNoticeResource(useCallback(signal => extras.profile(signal), [extras]));
  return <AppScreen title="개인정보 설정" onBack={() => router.dismissTo('/account')}>
    <IntroCard title="개인 기록 공개 범위">개인 묵상과 기도는 본인 계정으로만 조회합니다. 상담·심방은 별도 전달 안내와 동의가 필요합니다.</IntroCard>
    {!!options.error && <Failure message={options.error} retry={options.reload} />}{!!profile.error && <Failure message={profile.error} retry={profile.reload} />}
    <Card title="동의 내역">{profile.data?.consentVersion ? `기록된 동의 버전: ${profile.data.consentVersion}` : '확인된 가입 동의 내역이 없습니다.'}</Card>
    <MenuCard title="선택 알림 설정" description="가입 필수 동의와 별도로 선택합니다." onPress={() => router.push('/notifications/settings')} />
    <Card title="개인정보 처리방침">{options.data?.policy?.privacy ?? '실제 개인정보 처리방침과 수집 항목은 확정 전입니다.'}</Card>
    <MenuCard title="계정 삭제 안내" onPress={() => router.push('/account/delete')} />
  </AppScreen>;
}
export function DeleteAccountScreen() { return <MemberGate returnTo="/account/delete"><DeleteAccount /></MemberGate>; }
function DeleteAccount() {
  const { extras, signOut } = useMemberSession(); const options = useMemberOptions(); const [checked, setChecked] = useState(false); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  async function remove() { if (lock.current || !options.data?.deletion || !options.data.policy || !checked) return; lock.current = true; setBusy(true); setError(''); try { await extras.deleteAccount(password, options.data.deletionPolicyVersion ?? options.data.policy.version); setPassword(''); setConfirm(false); await signOut().catch(() => {}); router.replace('/account/deletion-received'); } catch (cause) { setConfirm(false); setError(cause instanceof Error ? cause.message : '탈퇴하지 못했습니다.'); } finally { setPassword(''); setBusy(false); lock.current = false; } }
  return <AppScreen title="회원탈퇴 안내" onBack={() => router.dismissTo('/account')}>
    {options.loading && <ActivityIndicator accessibilityLabel="탈퇴 안내를 불러오는 중" />}{!!options.error && <Failure message={options.error} retry={options.reload} />}
    <IntroCard title="탈퇴 전 확인해 주세요">{options.data?.policy?.deletion ?? '삭제 대상과 보관 기준은 아직 확정 전입니다. 현재 실제 탈퇴는 진행할 수 없습니다.'}</IntroCard>
    <Check label="내용을 확인했습니다" value={checked} onChange={setChecked} disabled={!options.data?.deletion || busy} />
    <FormField label="현재 비밀번호" value={password} onChangeText={setPassword} secureTextEntry maxLength={128} editable={!busy && !!options.data?.deletion} />
    <Action title="탈퇴 계속하기" disabled={!checked || !password || busy || !options.data?.deletion} onPress={() => setConfirm(true)} />
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}<MenuCard title="취소" onPress={() => router.dismissTo('/account')} />
    <ConfirmDialog busy={busy} visible={confirm} title={options.data?.mode === 'preview' ? '테스트 계정을 삭제할까요?' : '탈퇴를 요청할까요?'} message={options.data?.mode === 'preview' ? '이 서버의 테스트 계정과 개인 기록이 삭제됩니다. 되돌릴 수 없습니다.' : '접수되면 개인 기록을 이용할 수 없으며 안내된 범위의 자료가 삭제됩니다. 계정 삭제는 이어서 처리됩니다. 접수 후 되돌릴 수 없습니다.'} confirmLabel={busy ? '처리 중' : options.data?.mode === 'preview' ? '테스트 계정 삭제' : '탈퇴 요청'} onCancel={() => { if (!busy) setConfirm(false); }} onConfirm={() => void remove()} />
  </AppScreen>;
}
