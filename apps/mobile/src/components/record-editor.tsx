import { useDraftCache } from '../hooks/use-draft-cache';
import { ReauthAction } from './reauth-action';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { memberRecordInputSchema, memberRecordKindSchema, recordWorshipSchema, type MemberRecordInput } from '@daegwang/contracts/features/member/records';
import { useMemberSession } from './member-session';
import { AppScreen, IntroCard } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { ConfirmDialog } from './confirm-dialog';
import { worshipClient } from '../lib/api';
import { koreaDate } from '../hooks/use-latest-devotional';

export function RecordEditor({ id, kind: kindValue, worshipId, reflectionId }: { id?: string; kind?: string; worshipId?: string; reflectionId?: string }) {
  const { client } = useMemberSession(); const navigation = useNavigation();
  const [content, setContent] = useState<MemberRecordInput | null>(null); const [original, setOriginal] = useState(''); const [version, setVersion] = useState(1);
  const [loadError, setLoadError] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<NavigationAction | null>(null); const [savedId, setSavedId] = useState<string | null>(null); const saving = useRef(false);
  const dirty = !!content && JSON.stringify(content) !== original && !savedId;
  const cache = useDraftCache(`record:${id ?? [kindValue, worshipId, reflectionId].join(':')}`, { content, version, original }, dirty);
  usePreventRemove(dirty || busy, ({ data }) => { if (!busy) setPending(data.action); });
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  useEffect(() => { if (savedId) router.dismissTo({ pathname: '/records/[id]', params: { id: savedId } }); }, [savedId]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        if (cache.restored?.content) { setContent(cache.restored.content); setVersion(cache.restored.version); setOriginal(cache.restored.original); return; }
        let next: MemberRecordInput;
        if (id) { const row = await client.detail(id, controller.signal); if (controller.signal.aborted) return; setVersion(row.version); next = row.content; }
        else {
          const kind = memberRecordKindSchema.safeParse(kindValue).data ?? 'REFLECTION'; const common = { title: '', body: '', date: koreaDate() };
          if (kind === 'REFLECTION') {
            if (!worshipId) throw new Error('말씀 상세에서 묵상 기록하기를 선택해 주세요.');
            const worship = await worshipClient.detail(worshipId, controller.signal);
            next = { ...common, kind, worship: recordWorshipSchema.strip().parse(worship) };
          } else {
            if (reflectionId) { const linked = await client.detail(reflectionId, controller.signal); if (linked.content.kind !== 'REFLECTION') throw new Error('연결할 묵상을 찾을 수 없습니다.'); }
            next = kind === 'PRAYER' ? { ...common, kind, reflectionId: reflectionId ?? null } : { ...common, kind, date: null, reflectionId: reflectionId ?? null, answeredOn: null, gratitude: '' };
          }
        }
        if (!controller.signal.aborted) { setContent(next); setOriginal(JSON.stringify(next)); }
      } catch (cause) { if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : '기록을 불러오지 못했습니다.'); }
    }
    void load(); return () => controller.abort();
  }, [id, kindValue, worshipId, reflectionId, client, attempt, cache.restored]);
  async function save() {
    if (saving.current || !content) return;
    const parsed = memberRecordInputSchema.safeParse(content);
    if (!parsed.success) { setError('내용과 날짜를 확인해 주세요. 날짜는 YYYY-MM-DD 형식이며 내용은 20,000자 이내입니다.'); return; }
    saving.current = true; setBusy(true); setError('');
    try { const result = id ? await client.update(id, version, parsed.data) : await client.create(parsed.data); cache.clear(); setSavedId(result.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 입력한 내용은 유지됩니다.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const label = content?.kind === 'REFLECTION' ? '묵상' : content?.kind === 'SPECIAL_PRAYER' ? '특별기도' : '개인 기도';
  const field = (labelText: string, value: string, change: (value: string) => void, multiline = false, maxLength = 20000) => <View style={{ gap: 6 }}><Text style={styles.caption}>{labelText}</Text><TextInput accessibilityLabel={labelText} value={value} onChangeText={change} editable={!busy} multiline={multiline} maxLength={maxLength} style={[styles.input, multiline && { minHeight: 148, textAlignVertical: 'top' }]} /></View>;
  return <AppScreen title={`${label} ${id ? '수정' : '작성'}`} onBack={() => router.canGoBack() ? router.back() : router.replace('/my')}>
    {!content && !loadError && <ActivityIndicator accessibilityLabel="작성 화면을 준비하는 중" />}
    {!!loadError && <><Failure message={loadError} retry={() => { setLoadError(''); setAttempt(attempt + 1); }} /><Action title="말씀 목록" onPress={() => router.replace('/devotional')} /></>}
    {content && <>
      {content.kind === 'REFLECTION' ? <Card title="연결된 말씀">{content.worship.title}{'\n'}{content.worship.scriptureReference}</Card> : content.kind === 'SPECIAL_PRAYER' ? <IntroCard title="특별히 품고 싶은 기도">원하는 기도만 제목을 정해 관리하세요.</IntroCard> : <IntroCard title="나만 볼 수 있어요">제목이나 결론 없이 편하게 남겨도 괜찮아요.</IntroCard>}
      {content.kind === 'REFLECTION' && <Card title="한 문장만 남겨도 괜찮아요">마음에 남은 말씀은 무엇인가요?{ '\n' }그 말씀 앞에서 내 마음은 어떤가요?{ '\n' }이 중 하나만 골라 적어보세요. 답을 잘 쓰는 숙제가 아닙니다.</Card>}
      {content.kind === 'PRAYER' && <Card title="어떻게 시작할지 막막하다면">감사한 일 하나, 걱정되는 일 하나, 생각나는 사람 한 명 중 하나를 골라 편하게 남겨보세요.</Card>}
      {field(content.kind === 'REFLECTION' ? '나의 묵상' : content.kind === 'SPECIAL_PRAYER' ? '기도 내용 · 선택' : '오늘의 기도', content.body, body => setContent({ ...content, body }), true)}
      {content.kind !== 'REFLECTION' && field(content.kind === 'SPECIAL_PRAYER' ? '기도제목' : '제목 · 선택', content.title, title => setContent({ ...content, title }), false, 200)}
      {content.kind !== 'SPECIAL_PRAYER' && field('기록 날짜', content.date, date => setContent({ ...content, date }), false, 10)}
      {content.kind === 'SPECIAL_PRAYER' && <>{field('시작일 · 선택', content.date ?? '', date => setContent({ ...content, date: date || null }), false, 10)}{id && <>{field('응답일 · 선택', content.answeredOn ?? '', answeredOn => setContent({ ...content, answeredOn: answeredOn || null }), false, 10)}{field('감사 기록 · 선택', content.gratitude, gratitude => setContent({ ...content, gratitude }), true)}</>}</>}
      <IntroCard title="나만 볼 수 있어요">저장한 기록은 나의 기록에서 다시 확인할 수 있습니다.</IntroCard>
      {!!error && <Text accessibilityRole="alert" selectable style={styles.caption}>{error}</Text>}
      <ReauthAction error={error} returnTo={id ? `/records/edit/${id}` : `/records/new?kind=${content.kind}${worshipId ? `&worshipId=${worshipId}` : ''}${reflectionId ? `&reflectionId=${reflectionId}` : ''}`} />
      <Action title={busy ? '저장 중' : content.kind === 'REFLECTION' ? '묵상 저장' : content.kind === 'SPECIAL_PRAYER' ? '특별기도로 저장' : '비공개로 저장'} disabled={busy} onPress={() => void save()} />
      <Text style={styles.caption}>{cache.restored ? '작성하던 내용을 복구했습니다. ' : ''}입력 중인 내용은 앱이 열린 동안 최대 30분간 임시로 보관합니다. 앱 종료·새로고침·로그아웃 시 사라집니다.</Text>
    </>}
    <ConfirmDialog visible={!!pending} title="작성을 그만둘까요?" message="저장하지 않은 내용은 사라집니다." confirmLabel="저장하지 않고 나가기" onCancel={() => setPending(null)} onConfirm={() => { const action = pending; cache.clear(); setPending(null); if (action) navigation.dispatch(action); }} />
  </AppScreen>;
}
