import {DataLoading} from '../../components/data-loading';
import { MonthPicker } from '../../components/date-picker';
import { useCallback, useState } from 'react';
import { } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { memberRecordKindSchema } from '@daegwang/contracts/features/member/records';
import { MemberGate, useMemberSession } from '../../components/member-session';
import { AppScreen, IntroCard, MenuCard } from '../../components/app-screen';
import { Action, Card, Failure } from '../../components/ui';
import { useNoticeResource } from '../../hooks/use-notices';
import { FaithCalendar } from '../../components/faith-calendar';
import { PrayerTopics } from '../../components/prayer-topics';

export default function Records() { const { kind, reflectionId, date } = useLocalSearchParams<{ kind?: string; reflectionId?: string; date?: string }>(); return <MemberGate returnTo={`/records?kind=${memberRecordKindSchema.safeParse(kind).data ?? 'REFLECTION'}${date ? `&date=${date}` : ''}`}><RecordList key={`${kind ?? ''}:${date ?? ''}`} kindValue={kind} reflectionId={reflectionId} date={date} /></MemberGate>; }
function RecordList({ kindValue, reflectionId, date }: { kindValue?: string; reflectionId?: string; date?: string }) {
  const kind = memberRecordKindSchema.safeParse(kindValue).data ?? 'REFLECTION';
  const [calendar, setCalendar] = useState(kind === 'REFLECTION');
  if (kind === 'SPECIAL_PRAYER') return <PrayerTopics />;
  if (calendar && kind === 'REFLECTION') return <FaithCalendar initialDate={date} onList={() => setCalendar(false)} />;
  return <RecordRows kind={kindValue === undefined ? undefined : kind} reflectionId={reflectionId} onCalendar={() => kind === 'REFLECTION' ? setCalendar(true) : router.replace('/records')} />;
}
function RecordRows({ kind, reflectionId, onCalendar }: { kind?: 'REFLECTION' | 'PRAYER' | 'SPECIAL_PRAYER'; reflectionId?: string; onCalendar: () => void }) {
  const { client } = useMemberSession();
  const [page, setPage] = useState(0); const [month, setMonth] = useState('');
  const resource = useNoticeResource(useCallback(signal => client.list({ kind, page, month: month || undefined, reflectionId }, signal), [client, kind, page, month, reflectionId]));
  const label = kind === 'REFLECTION' ? '묵상' : kind === 'PRAYER' ? '개인 기도' : kind === 'SPECIAL_PRAYER' ? '기도제목' : '전체';
  return <AppScreen title={`${label} 기록 목록`} onBack={() => router.dismissTo('/my')}>
    <MenuCard title="하루 기록 · 캘린더" onPress={onCalendar} />
    <IntroCard title="나만 보는 기록">개인 기록은 교회 관리자 화면에 공유되지 않습니다.</IntroCard>
    <MonthPicker label="기록 조회 연월" value={month} onChange={value => { setMonth(value); setPage(0); }} />
    {resource.loading && <DataLoading label="기록을 불러오는 중"/>}
    {!!resource.error && <Failure message={resource.error} retry={() => void resource.reload()} />}
    {resource.data?.data.map(record => <MenuCard key={record.id} title={`${record.content.date ?? '시작일 미정'} · ${record.content.title || label}`} description={record.content.body.slice(0, 100)} onPress={() => router.push({ pathname: '/records/[id]', params: { id: record.id } })} />)}
    {resource.data && !resource.data.data.length && <Card title="저장된 기록이 없습니다">마음에 남은 내용을 기록해 보세요.</Card>}
    {page > 0 && <Action title="이전 기록" onPress={() => setPage(page - 1)} />}
    {resource.data?.nextPage != null && <Action title="다음 기록" onPress={() => setPage(resource.data!.nextPage!)} />}
    <Action title="하루 기록 남기기" onPress={() => router.push('/records')} />
  </AppScreen>;
}
