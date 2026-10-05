import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { memberRecordKindSchema } from '@daegwang/contracts/features/member/records';
import { MemberGate, useMemberSession } from '../../components/member-session';
import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure, styles } from '../../components/ui';
import { useNoticeResource } from '../../hooks/use-notices';
import { ReflectionCalendar } from '../../components/reflection-calendar';

export default function Records() { const { kind, reflectionId } = useLocalSearchParams<{ kind?: string; reflectionId?: string }>(); return <MemberGate returnTo={`/records?kind=${memberRecordKindSchema.safeParse(kind).data ?? 'REFLECTION'}`}><RecordList kindValue={kind} reflectionId={reflectionId} /></MemberGate>; }
function RecordList({ kindValue, reflectionId }: { kindValue?: string; reflectionId?: string }) {
  const kind = memberRecordKindSchema.safeParse(kindValue).data ?? 'REFLECTION';
  const [calendar, setCalendar] = useState(kind === 'REFLECTION');
  if (calendar && kind === 'REFLECTION') return <ReflectionCalendar onList={() => setCalendar(false)} />;
  return <RecordRows kind={kind} reflectionId={reflectionId} onCalendar={() => setCalendar(true)} />;
}
function RecordRows({ kind, reflectionId, onCalendar }: { kind: 'REFLECTION' | 'PRAYER' | 'SPECIAL_PRAYER'; reflectionId?: string; onCalendar: () => void }) {
  const { client } = useMemberSession();
  const [page, setPage] = useState(0); const [month, setMonth] = useState(''); const [draft, setDraft] = useState(''); const [filterError, setFilterError] = useState('');
  const resource = useNoticeResource(useCallback(signal => client.list({ kind, page, month: month || undefined, reflectionId }, signal), [client, kind, page, month, reflectionId]));
  const label = kind === 'REFLECTION' ? '묵상' : kind === 'PRAYER' ? '개인 기도' : '특별기도';
  return <AppScreen title={`${label} 기록 목록`} onBack={() => router.dismissTo('/my')}>
    {kind === 'REFLECTION' && <MenuCard title="캘린더로 보기" onPress={onCalendar} />}
    <IntroCard title="나만 보는 기록">개인 기록은 교회 관리자 화면에 공유되지 않습니다.</IntroCard>
    <Text style={styles.caption}>기간 선택 · 비우면 전체</Text><TextInput accessibilityLabel="기록 조회 연월" placeholder="YYYY-MM" value={draft} onChangeText={setDraft} maxLength={7} style={styles.input} />
    <Action title="기간 적용" onPress={() => { if (draft && !/^\d{4}-(0[1-9]|1[0-2])$/.test(draft)) { setFilterError('YYYY-MM 형식으로 입력해 주세요.'); return; } setFilterError(''); setMonth(draft); setPage(0); }} />
    {!!filterError && <Text accessibilityRole="alert" style={styles.caption}>{filterError}</Text>}
    {resource.loading && <ActivityIndicator accessibilityLabel="기록을 불러오는 중" />}
    {!!resource.error && <Failure message={resource.error} retry={() => void resource.reload()} />}
    {resource.data?.data.map(record => <MenuCard key={record.id} title={`${record.content.date ?? '시작일 미정'} · ${record.content.title || label}`} description={record.content.body.slice(0, 100)} onPress={() => router.push({ pathname: '/records/[id]', params: { id: record.id } })} />)}
    {resource.data && !resource.data.data.length && <Card title="저장된 기록이 없습니다">마음에 남은 내용을 기록해 보세요.</Card>}
    {page > 0 && <Action title="이전 기록" onPress={() => setPage(page - 1)} />}
    {resource.data?.nextPage != null && <Action title="다음 기록" onPress={() => setPage(resource.data!.nextPage!)} />}
    <Action title={`${label} 기록하기`} onPress={() => kind === 'REFLECTION' ? router.push('/devotional') : router.push({ pathname: '/records/new', params: { kind, ...(reflectionId ? { reflectionId } : {}) } })} />
  </AppScreen>;
}
