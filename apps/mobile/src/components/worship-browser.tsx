import { useState } from 'react';
import { VideoThumbnail } from './video-thumbnail';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { appWorshipListSchema, worshipTypeLabels } from '@daegwang/contracts/features/worship/app-contract';
import { AppScreen, IntroCard, MenuCard } from './app-screen';
import { Action, Card, Failure, colors, styles } from './ui';
import { useWorshipFeed } from '../hooks/use-worship-feed';

type Filters = { from: string; to: string; scripture: string; preacher: string };
const empty: Filters = { from: '', to: '', scripture: '', preacher: '' };
export function WorshipBrowser({ search = false }: { search?: boolean }) {
  const [group, setGroup] = useState(search ? 'all' : 'sunday');
  const [query, setQuery] = useState(''); const [submitted, setSubmitted] = useState<string | null>(null);
  const [filters, setFilters] = useState(empty); const [draft, setDraft] = useState(empty); const [filterOpen, setFilterOpen] = useState(false); const [filterError, setFilterError] = useState('');
  const active = Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
  const feed = useWorshipFeed({ type: group === 'devotional' ? 'FIRST_HOUR' : 'ALL', group: ['sunday', 'special', 'sermon'].includes(group) ? group as 'sunday' | 'special' | 'sermon' : undefined, q: submitted?.trim() || undefined, ...active }, !search || submitted !== null);
  const openFilter = () => { setDraft(filters); setFilterError(''); setFilterOpen(true); };
  const submit = () => { setSubmitted(query.trim()); };
  return <AppScreen title={search ? submitted === null ? '말씀 검색' : '검색 결과' : '설교 목록'} onBack={() => router.canGoBack() ? router.back() : router.replace('/worship')}>
    {search && <><Text style={styles.caption}>검색어</Text><TextInput accessibilityLabel="말씀 검색어" style={styles.input} placeholder="제목, 본문 위치, 설교자 입력" maxLength={100} value={query} onChangeText={setQuery} onSubmitEditing={submit} returnKeyType="search" /><Action title="검색" onPress={submit} /></>}
    {search && submitted === null && <IntroCard title="말씀을 찾아보세요">예: 요한복음, 기도, 설교자 이름</IntroCard>}
    {(!search || submitted !== null) && <View style={{ flexDirection: 'row', backgroundColor: colors.soft, borderRadius: 12, paddingHorizontal: 10 }}>
      {(search ? [['all', '전체'], ['devotional', '묵상'], ['sermon', '설교']] : [['sunday', '주일설교'], ['special', '특별말씀']]).map(([value, label]) => <Pressable key={value} accessibilityRole="tab" aria-selected={value === group} accessibilityState={{ selected: value === group }} onPress={() => setGroup(value)} style={{ minHeight: 48, paddingHorizontal: 10, justifyContent: 'center' }}><Text style={value === group ? styles.title : styles.caption}>{label}</Text></Pressable>)}
    </View>}
    <MenuCard title={search ? '상세 필터' : '필터'} description={Object.values(active).join(' · ') || '날짜 · 본문 위치 · 설교자'} onPress={openFilter} />
    {(!search || submitted !== null) && <>
      {feed.loading && <ActivityIndicator color={colors.primary} accessibilityLabel="말씀을 불러오는 중" />}
      {!!feed.error && <Failure message={feed.error} retry={feed.data ? feed.more : feed.reload} />}
      {feed.data && !feed.data.data.length && <Card title={search ? '검색 결과가 없습니다' : '등록된 설교가 없습니다'}>검색어와 필터를 바꿔 다시 확인해 주세요.</Card>}
      {feed.data?.data.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.title} 상세 보기`} style={styles.card} onPress={() => router.push({ pathname: item.type === 'FIRST_HOUR' ? '/devotional/[id]' : '/sermons/[id]', params: { id: item.id } })}><VideoThumbnail videoId={item.youtube.videoId} /><Text style={styles.title}>{item.title}</Text><Text style={styles.caption}>{[worshipTypeLabels[item.type], item.contentDate, item.scriptureReference, item.preacher].filter(Boolean).join(' · ')}</Text></Pressable>)}
      {!feed.loading && !feed.error && feed.data?.nextCursor && <Action title="더 보기" onPress={feed.more} />}
    </>}
    <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,46,50,0.25)' }}>
        <View accessibilityViewIsModal style={{ maxHeight: '85%', backgroundColor: colors.background, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <Text accessibilityRole="header" style={[styles.title, { fontSize: 22 }]}>말씀 필터</Text>
            {([['from', '시작일', 'YYYY-MM-DD'], ['to', '종료일', 'YYYY-MM-DD'], ['scripture', '본문 위치', '예: 요한복음 15'], ['preacher', '설교자', '설교자 이름']] as const).map(([key, label, placeholder]) => <View key={key} style={{ gap: 6 }}><Text style={styles.caption}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} value={draft[key]} placeholder={placeholder} maxLength={key === 'from' || key === 'to' ? 10 : 100} onChangeText={value => setDraft(previous => ({ ...previous, [key]: value }))} /></View>)}
            {!!filterError && <Text accessibilityRole="alert" style={styles.caption}>{filterError}</Text>}
            <Action title="결과 보기" onPress={() => { const input = Object.fromEntries(Object.entries(draft).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])); if (!appWorshipListSchema.safeParse(input).success) { setFilterError('날짜는 YYYY-MM-DD 형식으로, 시작일은 종료일 이전으로 입력해 주세요.'); return; } setFilters(draft); if (search) submit(); setFilterOpen(false); }} />
            <MenuCard title="필터 초기화" onPress={() => setDraft(empty)} /><MenuCard title="닫기" onPress={() => setFilterOpen(false)} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  </AppScreen>;
}
