import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MemberGate, useMemberSession } from '../components/member-session';
import { AppScreen, IntroCard, MenuCard } from '../components/app-screen';
import { Action, Card, Failure, colors, styles } from '../components/ui';
import { useNoticeResource } from '../hooks/use-notices';
import { worshipTypeLabels } from '@daegwang/contracts/features/worship/app-contract';
export default function SavedWorship() { return <MemberGate returnTo="/saved-worship"><SavedList /></MemberGate>; }
function SavedList() {
  const { bookmarks } = useMemberSession(); const [page, setPage] = useState(0); const [group, setGroup] = useState<'all' | 'devotional' | 'sermon' | 'other'>('all');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const resource = useNoticeResource(useCallback(signal => bookmarks.list({ page, group }, signal), [bookmarks, page, group]));
  async function remove(id: string) { if (busy) return; setBusy(true); setError(''); try { await bookmarks.remove(id); await resource.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : '저장을 해제하지 못했습니다.'); } finally { setBusy(false); } }
  return <AppScreen title="저장한 말씀" onBack={() => router.dismissTo('/my')}>
    <View style={{ flexDirection: 'row', backgroundColor: colors.soft, borderRadius: 12, paddingHorizontal: 10 }}>{([['all', '전체'], ['devotional', '묵상'], ['sermon', '설교'], ['other', '기타']] as const).map(([value, title]) => <Pressable key={value} accessibilityRole="tab" aria-selected={group === value} accessibilityState={{ selected: group === value }} onPress={() => { setGroup(value); setPage(0); }} style={{ minHeight: 48, padding: 10 }}><Text style={group === value ? styles.title : styles.caption}>{title}</Text></Pressable>)}</View>
    {resource.loading && <ActivityIndicator accessibilityLabel="저장한 말씀을 불러오는 중" />}
    {!!resource.error && <Failure message={resource.error} retry={() => void resource.reload()} />}
    {resource.data?.data.map(row => <View key={row.id} style={{ gap: 8 }}>{row.worship ? <MenuCard title={row.worship.title} description={`${worshipTypeLabels[row.worship.type]} · ${row.worship.contentDate}`} onPress={() => router.push({ pathname: row.worship!.type === 'FIRST_HOUR' ? '/devotional/[id]' : '/sermons/[id]', params: { id: row.worshipId } })} /> : <Card title="현재 공개되지 않은 말씀">저장을 해제할 수 있습니다.</Card>}<Action title={busy ? '처리 중' : '저장 해제'} disabled={busy} onPress={() => void remove(row.id)} /></View>)}
    {resource.data && !resource.data.data.length && <Card title="저장한 말씀이 없습니다">말씀 상세에서 저장해 보세요.</Card>}
    {!!error && <Failure message={error} retry={() => { setError(''); void resource.reload(); }} />}
    {page > 0 && <Action title="이전 저장 목록" onPress={() => setPage(page - 1)} />}{resource.data?.nextPage != null && <Action title="다음 저장 목록" onPress={() => setPage(resource.data!.nextPage!)} />}
    <IntroCard title="나의 말씀 보관함">묵상과 설교를 저장하고 다시 만나보세요.</IntroCard>
  </AppScreen>;
}
