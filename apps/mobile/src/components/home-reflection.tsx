import { useCallback } from 'react';
import { router } from 'expo-router';
import { useMemberSession } from './member-session';
import { MenuCard } from './app-screen';
import { Action, Card, Failure } from './ui';
import { useNoticeResource } from '../hooks/use-notices';
import { koreaDate } from '../hooks/use-latest-devotional';
export function HomeReflection({ worshipId }: { worshipId: string }) {
  const { session } = useMemberSession();
  return session ? <PersonalReflection key={session.user.id} worshipId={worshipId} /> : null;
}
function PersonalReflection({ worshipId }: { worshipId: string }) {
  const { client } = useMemberSession(); const date = koreaDate();
  const result = useNoticeResource(useCallback(signal => client.list({ kind: 'REFLECTION', worshipId, date }, signal), [client, worshipId, date]));
  const row = result.data?.data[0];
  if (result.error) return <Failure message="나의 묵상 상태를 확인하지 못했습니다." retry={result.reload} />;
  if (!row) return null;
  return <><Card title="오늘의 묵상을 기록했습니다">나의 기록을 돌아보거나 기도로 이어가세요.</Card>
    <Action title="이 묵상을 기도로 이어가기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER', reflectionId: row.id } })} />
    <MenuCard title="묵상 다시 보기" onPress={() => router.push({ pathname: '/records/[id]', params: { id: row.id } })} />
  </>;
}
