import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { churchStatusLabels, churchDetailsSchema } from '@daegwang/contracts/features/member/church-membership';
import { useMemberSession } from './member-session';
import { useNoticeResource } from '../hooks/use-notices';
import { ChurchRequestFields, emptyChurchDetails } from './church-request-fields';
import { Card, Failure, styles } from './ui';
export function ChurchMembership() {
  const { extras } = useMemberSession(); const [details, setDetails] = useState(emptyChurchDetails); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const lock = useRef(false);
  const result = useNoticeResource(useCallback(signal => extras.churchMembership(signal), [extras]));
  async function request(checked: boolean) { if (!checked || lock.current || !result.data) return; if (!churchDetailsSchema.safeParse(details).success) { setError('이름·연락처·직분을 먼저 입력해 주세요. 직분이 없으면 없음으로 입력해 주세요.'); return; } lock.current = true; setBusy(true); setError('');
    try { await extras.requestChurchMembership({ ...details, version: result.data.version }); setDetails(emptyChurchDetails); await result.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '요청하지 못했습니다.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <><Card title="대광교회 교인 확인">가입만으로 교인으로 등록되지는 않습니다. 교인 확인 없이도 개인 묵상과 기도를 이용할 수 있어요.</Card>
    {result.loading && <ActivityIndicator accessibilityLabel="교인 확인 상태를 불러오는 중" />}{!!result.error && <Failure message={result.error} retry={result.reload} />}
    {result.data && <><Text style={styles.caption}>{churchStatusLabels[result.data.status]}</Text>
      {result.data.status === 'UNCONFIRMED' && <ChurchRequestFields value={details} onChange={setDetails} checked={busy} onCheck={value => void request(value)} busy={busy} />}
      {result.data.status !== 'UNCONFIRMED' && <Text style={styles.caption}>{result.data.realName} · {result.data.phone} · {result.data.position}</Text>}
      {result.data.status === 'CONFIRMED' && <Text style={styles.caption}>소속: {result.data.groups.map(group => group.name).join(', ') || '지정된 소속 없음'}</Text>}
      {result.data.status === 'PENDING' && <Text style={styles.caption}>관리자가 확인하고 있습니다. 확인 후 이 화면에서 상태를 볼 수 있어요.</Text>}</>}
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}</>;
}
