import { TimePicker } from './time-picker';
import { DatePicker } from './date-picker';
import { useDraftCache } from '../hooks/use-draft-cache';
import { ReauthAction } from './reauth-action';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Switch, Text, TextInput, View } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { z } from 'zod';
import { personalScheduleSchema, type PersonalSchedule } from '@daegwang/contracts/features/member/schedules';
import { AppScreen } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { ConfirmDialog } from './confirm-dialog';
import { useMemberSession } from './member-session';
import { koreaDate } from '../hooks/use-latest-devotional';
export function ScheduleEditor({ id, date }: { id?: string; date?: string }) {
  const { schedules } = useMemberSession(); const navigation = useNavigation();
  const [content, setContent] = useState<PersonalSchedule | null>(() => id ? null : { kind: 'PERSONAL', title: '', startDate: z.iso.date().safeParse(date).data ?? koreaDate(), endDate: z.iso.date().safeParse(date).data ?? koreaDate(), allDay: false, startTime: '10:00', endTime: '11:00', location: '', note: '' });
  const [original, setOriginal] = useState(() => JSON.stringify(content)); const [version, setVersion] = useState(1); const [attempt, setAttempt] = useState(0); const [loadError, setLoadError] = useState(''); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false); const pendingSave = useRef(false); const [savedId, setSavedId] = useState<string | null>(null); const [pending, setPending] = useState<NavigationAction | null>(null);
  const dirty = !!content && JSON.stringify(content) !== original && !savedId;
  const cache = useDraftCache(`schedule:${id ?? date ?? 'new'}`, { content, version, original }, dirty);
  usePreventRemove(dirty || busy, ({ data }) => { if (!busy) setPending(data.action); });
  useEffect(() => { if (Platform.OS !== 'web' || !dirty) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty]);
  useEffect(() => { if (savedId) router.dismissTo({ pathname: '/schedules/[id]', params: { id: savedId } }); }, [savedId]);
  useEffect(() => { if (cache.restored?.content) { const restored = cache.restored; Promise.resolve().then(() => { setContent(restored.content); setVersion(restored.version); setOriginal(restored.original); }); return; } if (!id) return; const controller = new AbortController(); void schedules.detail(id, controller.signal).then(row => { if (controller.signal.aborted) return; if (!row.content) { setLoadError('교회 공식 일정은 개인이 수정할 수 없습니다.'); return; } setContent(row.content); setOriginal(JSON.stringify(row.content)); setVersion(row.version); }).catch(cause => { if (!controller.signal.aborted) setLoadError(cause.message); }); return () => controller.abort(); }, [schedules, id, attempt, cache.restored]);
  async function save() {
    if (pendingSave.current || !content) return;
    const parsed = personalScheduleSchema.safeParse(content);
    if (!parsed.success) { setError('제목과 날짜·시간을 확인해 주세요. 종료 날짜와 시간은 시작보다 늦어야 합니다.'); return; }
    pendingSave.current = true; setBusy(true); setError('');
    try { const row = id ? await schedules.update(id, version, parsed.data) : await schedules.create(parsed.data); cache.clear(); setSavedId(row.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다. 입력 내용은 유지됩니다.'); }
    finally { pendingSave.current = false; setBusy(false); }
  }
  const field = (label: string, value: string, change: (next: string) => void, maxLength: number, multiline = false) => <View style={{ gap: 6 }}><Text style={styles.caption}>{label}</Text><TextInput accessibilityLabel={label} value={value} editable={!busy} onChangeText={change} maxLength={maxLength} multiline={multiline} style={[styles.input, multiline && { minHeight: 148, textAlignVertical: 'top' }]} /></View>;
  return <AppScreen title={`개인 일정 ${id ? '수정' : '등록'}`} onBack={() => router.canGoBack() ? router.back() : router.replace('/schedules')}>
    <ReauthAction error={error} returnTo={id ? `/schedules/edit/${id}` : `/schedules/new${date ? `?date=${date}` : ''}`} />
    {cache.restored && <Card title="작성하던 내용을 복구했습니다">내용을 확인한 뒤 저장해 주세요.</Card>}
    {!content && !loadError && <ActivityIndicator accessibilityLabel="일정을 불러오는 중" />}{!!loadError && <Failure message={loadError} retry={() => { setLoadError(''); setAttempt(attempt + 1); }} />}
    {content && <>{field('일정 제목', content.title, title => setContent({ ...content, title }), 200)}
      <DatePicker label="시작 날짜" value={content.startDate} onChange={startDate => setContent({ ...content, startDate })} disabled={busy} /><DatePicker label="종료 날짜" value={content.endDate} onChange={endDate => setContent({ ...content, endDate })} disabled={busy} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}><Text style={styles.title}>종일</Text><Switch accessibilityLabel="종일 일정" value={content.allDay} disabled={busy} onValueChange={allDay => setContent({ ...content, allDay, startTime: allDay ? null : '10:00', endTime: allDay ? null : '11:00' })} /></View>
      {!content.allDay && <><TimePicker label="시작 시간 · 한국 시간" value={content.startTime ?? '10:00'} disabled={busy} onChange={startTime => setContent({ ...content, startTime })} /><TimePicker label="종료 시간 · 한국 시간" value={content.endTime ?? '11:00'} disabled={busy} onChange={endTime => setContent({ ...content, endTime })} /></>}
      {field('장소 · 선택', content.location, location => setContent({ ...content, location }), 300)}{field('메모 · 선택', content.note, note => setContent({ ...content, note }), 10000, true)}
      <Card title="알림">알림 설정에서 이 휴대폰의 푸시를 연결하고 ‘내가 만든·저장한 일정’을 켜면 시작 30분 전, 종일 일정은 오전 8시에 알려드립니다.</Card>{!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}<Action title={busy ? '저장 중' : '일정 저장'} disabled={busy} onPress={() => void save()} />
    </>}
    <ConfirmDialog visible={!!pending} title="작성을 그만둘까요?" message="저장하지 않은 내용은 사라집니다." confirmLabel="저장하지 않고 나가기" onCancel={() => setPending(null)} onConfirm={() => { const action = pending; cache.clear(); setPending(null); if (action) navigation.dispatch(action); }} />
  </AppScreen>;
}
