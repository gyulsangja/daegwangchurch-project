import { DatePicker } from './date-picker';
import { useDraftCache } from '../hooks/use-draft-cache';
import { ReauthAction } from './reauth-action';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Platform, Text, TextInput, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { memberRecordInputSchema, memberRecordKindSchema, recordWorshipSchema, type MemberRecordInput, type MemberRecord } from '@daegwang/contracts/features/member/records';
import { z } from 'zod';
import { collectPages } from '@daegwang/api-client/pagination';
import { useMemberSession } from './member-session';
import { AppScreen, IntroCard, MenuCard, screenStyles } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { ConfirmDialog } from './confirm-dialog';
import { worshipClient } from '../lib/api';
import { koreaDate } from '../hooks/use-latest-devotional';

export function RecordEditor({ id, kind: kindValue, worshipId, reflectionId, date: selectedDate, prayerTopicId }: { id?: string; kind?: string; worshipId?: string; reflectionId?: string; date?: string; prayerTopicId?: string }) {
  const { client } = useMemberSession(); const navigation = useNavigation();
  const [topicError, setTopicError] = useState(''); const [topicAttempt, setTopicAttempt] = useState(0); const [topicsLoading, setTopicsLoading] = useState(true);
  const [editingId, setEditingId] = useState(id); const [topics, setTopics] = useState<MemberRecord[]>([]); const [choosingTopic, setChoosingTopic] = useState(false); const [topicSearch, setTopicSearch] = useState('');
  const [content, setContent] = useState<MemberRecordInput | null>(null); const [original, setOriginal] = useState(''); const [version, setVersion] = useState(1);
  const [loadError, setLoadError] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<NavigationAction | null>(null); const [savedId, setSavedId] = useState<string | null>(null); const saving = useRef(false);
  const dirty = !!content && JSON.stringify(content) !== original && !savedId;
  const cache = useDraftCache(`record:${id ?? [kindValue, worshipId, reflectionId, selectedDate, prayerTopicId].join(':')}`, { content, version, original, editingId }, dirty);
  usePreventRemove(dirty || busy, ({ data }) => { if (!busy) setPending(data.action); });
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  useEffect(() => { if (savedId && content) { if (content.kind === 'SPECIAL_PRAYER') router.dismissTo({ pathname: '/records/[id]', params: { id: savedId } }); else router.dismissTo({ pathname: '/records', params: { date: content.date } }); } }, [savedId, content]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (cache.restored?.content) { setContent(cache.restored.content); setVersion(cache.restored.version); setOriginal(cache.restored.original); setEditingId(cache.restored.editingId); return; }
        let next: MemberRecordInput;
        if (id) { const row = await client.detail(id, controller.signal); if (controller.signal.aborted) return; setVersion(row.version); next = row.content; }
        else {
          const kind = memberRecordKindSchema.safeParse(kindValue).data ?? 'REFLECTION'; const common = { title: '', body: '', date: z.iso.date().safeParse(selectedDate).data ?? koreaDate() };
          if (kind === 'REFLECTION') {
            const existing = (await client.list({ kind, date: common.date }, controller.signal)).data[0];
            if (existing) { next = existing.content; setEditingId(existing.id); setVersion(existing.version); }
            else { if (!worshipId) throw new Error('하루 기록에서 말씀을 선택해 주세요.'); const worship = await worshipClient.detail(worshipId, controller.signal); next = { ...common, kind, worship: recordWorshipSchema.strip().parse(worship) }; }
          } else {
            if (reflectionId) { const linked = await client.detail(reflectionId, controller.signal); if (linked.content.kind !== 'REFLECTION') throw new Error('연결할 묵상을 찾을 수 없습니다.'); }
            next = kind === 'PRAYER' ? { ...common, kind, reflectionId: reflectionId ?? null, ...(prayerTopicId ? { prayerTopicId } : {}) } : { ...common, kind, reflectionId: reflectionId ?? null, answeredOn: null, gratitude: '' };
          }
        }
        if (!controller.signal.aborted) { setContent(next); setOriginal(JSON.stringify(next)); }
      } catch (cause) { if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : '기록을 불러오지 못했습니다.'); }
    }
    void load(); return () => controller.abort();
  }, [id, kindValue, worshipId, reflectionId, selectedDate, prayerTopicId, client, attempt, cache.restored]);
  useEffect(() => { if (content?.kind !== 'PRAYER') return; const controller = new AbortController(); void collectPages((page, signal) => client.list({ kind: 'SPECIAL_PRAYER', page }, signal), controller.signal).then(rows => { if (!controller.signal.aborted) setTopics(rows); }).catch(() => { if (!controller.signal.aborted) setTopicError('기도제목을 불러오지 못했습니다.'); }).finally(() => { if (!controller.signal.aborted) setTopicsLoading(false); }); return () => controller.abort(); }, [content?.kind, client, topicAttempt]);
  async function save() {
    if (saving.current || !content) return;
    const parsed = memberRecordInputSchema.safeParse(content);
    if (!parsed.success) { setError('내용과 날짜를 확인해 주세요. 날짜는 YYYY-MM-DD 형식이며 내용은 20,000자 이내입니다.'); return; }
    saving.current = true; setBusy(true); setError('');
    try { const result = editingId ? await client.update(editingId, version, parsed.data) : await client.create(parsed.data); cache.clear(); setSavedId(result.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 입력한 내용은 유지됩니다.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const label = content?.kind === 'REFLECTION' ? '묵상' : content?.kind === 'SPECIAL_PRAYER' ? '기도제목' : '기도';
  const field = (labelText: string, value: string, change: (value: string) => void, multiline = false, maxLength = 20000) => <View style={{ gap: 6 }}><Text style={styles.caption}>{labelText}</Text><TextInput accessibilityLabel={labelText} value={value} onChangeText={change} editable={!busy} multiline={multiline} maxLength={maxLength} style={[styles.input, multiline && { minHeight: 148, textAlignVertical: 'top' }]} /></View>;
  return <AppScreen title={`${label} ${editingId ? '이어 쓰기' : '작성'}`} onBack={() => router.canGoBack() ? router.back() : router.replace('/records')}>
    {!content && !loadError && <ActivityIndicator accessibilityLabel="작성 화면을 준비하는 중" />}
    {!!loadError && <><Failure message={loadError} retry={() => { setLoadError(''); setAttempt(attempt + 1); }} /><Action title="말씀 목록" onPress={() => router.replace('/devotional')} /></>}
    {content && <>
      {content.kind === 'REFLECTION' ? <Card title="연결된 말씀">{content.worship.title}{'\n'}{content.worship.scriptureReference}</Card> : content.kind === 'SPECIAL_PRAYER' ? <IntroCard title="특별히 품고 싶은 기도">원하는 기도만 제목을 정해 관리하세요.</IntroCard> : <IntroCard title="나만 볼 수 있어요">제목이나 결론 없이 편하게 남겨도 괜찮아요.</IntroCard>}
      {content.kind === 'REFLECTION' && <Card title="한 문장만 남겨도 괜찮아요">마음에 남은 말씀은 무엇인가요?{ '\n' }그 말씀 앞에서 내 마음은 어떤가요?{ '\n' }이 중 하나만 골라 적어보세요. 답을 잘 쓰는 숙제가 아닙니다.</Card>}
      {content.kind === 'PRAYER' && <Card title="어떻게 시작할지 막막하다면">감사한 일 하나, 걱정되는 일 하나, 생각나는 사람 한 명 중 하나를 골라 편하게 남겨보세요.</Card>}
      {content.kind === 'PRAYER' && <><MenuCard title={topics.find(topic => topic.id === content.prayerTopicId)?.content.title ?? (content.prayerTopicId ? '연결된 기도제목' : '기도제목에 연결 · 선택')} description="같은 제목으로 여러 날의 기도를 모을 수 있어요." onPress={() => setChoosingTopic(!choosingTopic)} />{choosingTopic && <Modal visible transparent animationType="fade" onRequestClose={() => setChoosingTopic(false)}><View style={screenStyles.overlay}><View accessibilityViewIsModal style={[screenStyles.dialog, { maxHeight: '85%' }]}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}><Text accessibilityRole="header" style={styles.title}>기도제목 선택</Text>{topicsLoading && <ActivityIndicator />}{!!topicError && <Failure message={topicError} retry={() => { setTopicsLoading(true); setTopicError(''); setTopicAttempt(topicAttempt + 1); }} />}<TextInput accessibilityLabel="연결할 기도제목 검색" value={topicSearch} onChangeText={setTopicSearch} style={styles.input} placeholder="기도제목 검색" /><Action title="제목에 연결하지 않기" onPress={() => { setContent({ ...content, prayerTopicId: null }); setChoosingTopic(false); }} />{topics.filter(topic => topic.content.title.includes(topicSearch)).map(topic => <MenuCard key={topic.id} title={topic.content.title} onPress={() => { setContent({ ...content, prayerTopicId: topic.id }); setChoosingTopic(false); }} />)}{!topicsLoading && !topicError && !topics.filter(topic => topic.content.title.includes(topicSearch)).length && <Text style={styles.caption}>해당 기도제목이 없습니다.</Text>}<Action title="닫기" secondary onPress={() => setChoosingTopic(false)} /></ScrollView></View></View></Modal>}</>}
      {field(content.kind === 'REFLECTION' ? '나의 묵상' : content.kind === 'SPECIAL_PRAYER' ? '기도 내용 · 선택' : '오늘의 기도', content.body, body => setContent({ ...content, body }), true)}
      {content.kind !== 'REFLECTION' && field(content.kind === 'SPECIAL_PRAYER' ? '기도제목' : '제목 · 선택', content.title, title => setContent({ ...content, title }), false, 200)}
      {content.kind !== 'SPECIAL_PRAYER' && <DatePicker label="기록 날짜" value={content.date} onChange={date => setContent({ ...content, date })} disabled={busy} />}
      {content.kind === 'SPECIAL_PRAYER' && <><DatePicker label="시작일" value={content.date ?? ''} optional onChange={date => setContent({ ...content, date: date || null })} disabled={busy} />{id && <><DatePicker label="응답일" value={content.answeredOn ?? ''} optional onChange={answeredOn => setContent({ ...content, answeredOn: answeredOn || null })} disabled={busy} />{field('감사 기록 · 선택', content.gratitude, gratitude => setContent({ ...content, gratitude }), true)}</>}</>}
      <IntroCard title="나만 볼 수 있어요">저장한 기록은 나의 기록에서 다시 확인할 수 있습니다.</IntroCard>
      {!!error && <Text accessibilityRole="alert" selectable style={styles.caption}>{error}</Text>}
      <ReauthAction error={error} returnTo={editingId ? `/records/edit/${editingId}` : `/records/new?kind=${content.kind}${worshipId ? `&worshipId=${worshipId}` : ''}${reflectionId ? `&reflectionId=${reflectionId}` : ''}${content.date ? `&date=${content.date}` : ''}${prayerTopicId ? `&prayerTopicId=${prayerTopicId}` : ''}`} />
      <Action title={busy ? '저장 중' : content.kind === 'REFLECTION' ? '묵상 저장' : content.kind === 'SPECIAL_PRAYER' ? '기도제목 저장' : '기도 저장'} disabled={busy} onPress={() => void save()} />
      <Text style={styles.caption}>{cache.restored ? '작성하던 내용을 복구했습니다. ' : ''}입력 중인 내용은 앱이 열린 동안 최대 30분간 임시로 보관합니다. 앱 종료·새로고침·로그아웃 시 사라집니다.</Text>
    </>}
    <ConfirmDialog visible={!!pending} title="작성을 그만둘까요?" message="저장하지 않은 내용은 사라집니다." confirmLabel="저장하지 않고 나가기" onCancel={() => setPending(null)} onConfirm={() => { const action = pending; cache.clear(); setPending(null); if (action) navigation.dispatch(action); }} />
  </AppScreen>;
}
