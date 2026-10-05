import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { useMemberSession } from './member-session';
import { IntroCard } from './app-screen';
import { Action, Failure, styles } from './ui';
import { useNoticeResource } from '../hooks/use-notices';
import { devicePushState, disableDevicePush, enableDevicePush, observeDevicePush, openPushSettings } from '../lib/device-push';

export function PushNotificationBridge() {
  const { push, session } = useMemberSession(); const owner = session?.user.id ?? null;
  useEffect(() => observeDevicePush(push, owner, id => router.push({ pathname: '/notifications/[id]', params: { id } })), [push, owner]);
  return null;
}
const copy = {
  web: ['휴대폰에 설치한 앱에서 받아요', '지금 보고 있는 브라우저 미리보기에서는 휴대폰 푸시를 받을 수 없습니다. 설치한 앱에서 알림을 허용해 주세요.'],
  setup: ['휴대폰 알림 연결 준비 중', '이 앱의 푸시 연결이 아직 완료되지 않았습니다. 수신 항목은 미리 저장할 수 있지만, 현재 휴대폰으로 발송되지는 않습니다.'],
  off: ['이 휴대폰에서 알림 받기', '앱을 닫아 두어도 선택한 말씀과 교회 소식을 받을 수 있습니다. 아래 버튼을 눌러 알림을 허용해 주세요.'],
  denied: ['휴대폰 알림 권한이 꺼져 있어요', '휴대폰 설정에서 대광교회 알림을 허용한 뒤, 이 화면에서 알림 받기를 눌러 주세요.'],
  enabled: ['이 휴대폰의 푸시가 연결되었어요', '아래에서 켜고 저장한 항목을 받습니다. 휴대폰의 방해금지·절전·네트워크 상태에 따라 표시가 늦어질 수 있습니다.'],
  pending: ['알림 해제를 다시 확인해 주세요', '연결 문제로 서버의 해제를 완료하지 못했습니다. 해제를 다시 시도하거나 휴대폰 설정에서 알림을 꺼 주세요.'],
} as const;
export function PushDeviceControls() {
  const { push, session } = useMemberSession(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const result = useNoticeResource(useCallback(() => devicePushState(push, session!.user.id), [push, session]));
  async function perform(action: () => Promise<void>) { if (busy) return; setBusy(true); setError(''); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : '알림 연결을 확인해 주세요.'); } finally { setBusy(false); result.reload(); } }
  const current = result.data;
  return <>
    {current && <IntroCard title={copy[current.state][0]}>{copy[current.state][1]}</IntroCard>}
    {current && ['off', 'denied'].includes(current.state) && <Action title={busy ? '연결 중' : '이 휴대폰에서 알림 받기'} disabled={busy} onPress={() => void perform(() => enableDevicePush(push, session!.user.id))} />}
    {current?.canDisable && <Action secondary title={busy ? '처리 중' : '이 휴대폰의 푸시 끄기'} disabled={busy} onPress={() => void perform(disableDevicePush)} />}
    {current && ['denied', 'pending'].includes(current.state) && <Action secondary title="휴대폰 알림 설정 열기" onPress={() => void perform(openPushSettings)} />}
    {result.error && <Failure message="휴대폰 알림 연결 상태를 확인하지 못했습니다." retry={result.reload} />}
    {error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
  </>;
}
