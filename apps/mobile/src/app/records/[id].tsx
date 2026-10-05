import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MemberGate, useMemberSession } from '../../components/member-session';
import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure } from '../../components/ui';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { useNoticeResource } from '../../hooks/use-notices';
export default function RecordPage() { const { id } = useLocalSearchParams<{ id: string }>(); return <MemberGate returnTo={`/records/${id}`}><RecordDetail id={id} /></MemberGate>; }
function RecordDetail({ id }: { id: string }) {
  const { client } = useMemberSession(); const resource = useNoticeResource(useCallback(signal => client.detail(id, signal), [client, id]));
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const item = resource.data; const content = item?.content;
  async function remove() {
    if (!item || busy) return; setBusy(true); setError('');
    try { await client.remove(id, item.version); setConfirm(false); router.replace({ pathname: '/records', params: { kind: item.content.kind } }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '삭제하지 못했습니다.'); setConfirm(false); }
    finally { setBusy(false); }
  }
  return <AppScreen title={content?.kind === 'REFLECTION' ? '묵상 상세' : '기도 상세'} onBack={() => router.replace({ pathname: '/records', params: { kind: content?.kind ?? 'REFLECTION' } })}>
    {resource.loading && <ActivityIndicator accessibilityLabel="기록을 불러오는 중" />}
    {!!resource.error && <Failure message={resource.error} retry={() => void resource.reload()} />}
    {content && <><IntroCard title="나만 보는 기록">교회 관리자 화면에 공유되지 않습니다.</IntroCard>
      {content.kind === 'REFLECTION' && <MenuCard title="연결된 말씀" description={`${content.worship.title} · ${content.worship.scriptureReference ?? ''}`} onPress={() => router.push({ pathname: '/devotional/[id]', params: { id: content.worship.id } })} />}
      <Card title={content.title || (content.kind === 'REFLECTION' ? '오늘의 묵상' : '오늘의 기도')}>{content.body}</Card>
      <Card title="기록 날짜 / 수정일">{content.date}{'\n'}{new Date(item!.updatedAt).toLocaleString('ko-KR')}</Card>
      {content.kind === 'SPECIAL_PRAYER' && <><Card title={content.answeredOn ? `응답 · ${content.answeredOn}` : '품고 있는 기도'}>{content.gratitude || '감사 기록이 없습니다.'}</Card><Action title="응답/감사 남기기" onPress={() => router.push({ pathname: '/records/edit/[id]', params: { id } })} /></>}
      {content.kind === 'REFLECTION' ? <><Action title="이 묵상을 기도로 이어가기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER', reflectionId: id } })} /><MenuCard title="연결된 기도" onPress={() => router.push({ pathname: '/records', params: { kind: 'PRAYER', reflectionId: id } })} /></> : content.reflectionId && <MenuCard title="연결된 묵상" onPress={() => router.push({ pathname: '/records/[id]', params: { id: content.reflectionId! } })} />}
      <MenuCard title="기록 수정" onPress={() => router.push({ pathname: '/records/edit/[id]', params: { id } })} />
      <MenuCard title="기록 삭제" onPress={() => setConfirm(true)} />
    </>}
    {!!error && <Failure message={error} retry={() => { setError(''); void resource.reload(); }} />}
    <ConfirmDialog visible={confirm} title="기록을 삭제할까요?" message="삭제한 기록은 되돌릴 수 없습니다." confirmLabel="삭제하기" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void remove()} />
  </AppScreen>;
}
