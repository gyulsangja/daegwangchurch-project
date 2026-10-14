import { useCallback, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MemberGate, useMemberSession } from '../../components/member-session';
import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure } from '../../components/ui';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { useNoticeResource } from '../../hooks/use-notices';
import { PrayerTimeline } from '../../components/prayer-topics';
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
      <MenuCard title="이날의 말씀 · 묵상 · 기도" description={content.date ?? '하루 기록 캘린더'} onPress={() => router.push({ pathname: '/records', params: content.date ? { date: content.date } : {} })} />
      {content.kind === 'REFLECTION' && <MenuCard title="연결된 말씀" description={`${content.worship.title} · ${content.worship.scriptureReference ?? ''}`} onPress={() => router.push({ pathname: '/devotional/[id]', params: { id: content.worship.id } })} />}
      <Card title={content.title || (content.kind === 'REFLECTION' ? '오늘의 묵상' : '오늘의 기도')}>{content.body}</Card>
      <Card title="기록 날짜 / 수정일">{content.date}{'\n'}{new Date(item!.updatedAt).toLocaleString('ko-KR')}</Card>
      {content.kind === 'SPECIAL_PRAYER' && <><PrayerTimeline topicId={id} /><Card title={content.answeredOn ? `응답 · ${content.answeredOn}` : '품고 있는 기도'}>{content.gratitude || '응답과 감사는 원할 때 남겨주세요.'}</Card><Action title="응답/감사 남기기" onPress={() => router.push({ pathname: '/records/edit/[id]', params: { id } })} /></>}
      {content.kind === 'PRAYER' && content.prayerTopicId && <MenuCard title="이 기도제목으로 이어온 기록" onPress={() => router.push({ pathname: '/records/[id]', params: { id: content.prayerTopicId! } })} />}
      {content.kind === 'REFLECTION' ? <><Action title="이 묵상을 기도로 이어가기" onPress={() => router.push({ pathname: '/records/new', params: { kind: 'PRAYER', reflectionId: id } })} /><MenuCard title="연결된 기도" onPress={() => router.push({ pathname: '/records', params: { kind: 'PRAYER', reflectionId: id } })} /></> : content.reflectionId && <MenuCard title="연결된 묵상" onPress={() => router.push({ pathname: '/records/[id]', params: { id: content.reflectionId! } })} />}
      <MenuCard title="기록 수정" onPress={() => router.push({ pathname: '/records/edit/[id]', params: { id } })} />
      <MenuCard title="기록 삭제" onPress={() => setConfirm(true)} />
    </>}
    {!!error && <Failure message={error} retry={() => { setError(''); void resource.reload(); }} />}
    <ConfirmDialog visible={confirm} title="기록을 삭제할까요?" message={content?.kind === 'SPECIAL_PRAYER' ? '기도제목을 삭제해도 날짜별로 남긴 기도 기록은 캘린더에 보존됩니다.' : '삭제한 기록은 되돌릴 수 없습니다.'} confirmLabel="삭제하기" busy={busy} onCancel={() => setConfirm(false)} onConfirm={() => void remove()} />
  </AppScreen>;
}
