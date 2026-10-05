import { useDraftCache } from '../hooks/use-draft-cache';
import { ReauthAction } from './reauth-action';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { careInputSchema, careStatusLabels, type CareInput } from '@daegwang/contracts/features/member/extras';
import { MemberGate, useMemberSession } from './member-session';
import { AppScreen, IntroCard, MenuCard } from './app-screen';
import { Action, Card, Failure, styles } from './ui';
import { Check, Choice, FormField } from './form-controls';
import { DraftGuard } from './draft-guard';
import { ConfirmDialog } from './confirm-dialog';
import { useMemberOptions } from '../hooks/use-member-options';
import { usePagedResource } from '../hooks/use-paged-resource';
import { noticeDate, useNoticeResource } from '../hooks/use-notices';

export function CareHub() {
  return <AppScreen title="상담·심방 요청" onBack={() => router.canGoBack() ? router.back() : router.replace('/church')}>
    <IntroCard title="함께 이야기 나누고 싶을 때">상담과 심방 요청을 준비할 수 있습니다. 실제 접수 가능 여부는 작성 화면에서 안내합니다.</IntroCard>
    <MenuCard title="목회상담 요청" description="마음과 신앙생활에 대해 이야기 나눠요." onPress={() => router.push({ pathname: '/care/new', params: { kind: 'COUNSELING' } })} />
    <MenuCard title="심방 요청" description="방문이나 만남을 요청해요." onPress={() => router.push({ pathname: '/care/new', params: { kind: 'VISIT' } })} />
    <MenuCard title="내 요청 확인" onPress={() => router.push('/care/requests')} />
    <MenuCard title="전화로 문의하기" description="로그인 없이 연락처 확인" onPress={() => router.push('/church-info/contact')} />
  </AppScreen>;
}
export function CareNew() {
  const { kind } = useLocalSearchParams<{ kind?: string }>(); const mode = kind === 'VISIT' ? 'VISIT' : 'COUNSELING';
  return <MemberGate returnTo={`/care/new?kind=${mode}`}><CareEditor kind={mode} /></MemberGate>;
}
function CareEditor({ kind }: { kind: 'VISIT' | 'COUNSELING' }) {
  const { extras } = useMemberSession(); const options = useMemberOptions();
  const [content, setContent] = useState<CareInput>(kind === 'VISIT' ? { kind, name: '', phone: '', preferredTime: '', message: '', place: 'DISCUSS', location: '' } : { kind, name: '', phone: '', preferredTime: '', message: '', method: 'DISCUSS' });
  const [review, setReview] = useState(false); const [consent, setConsent] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false); const [savedId, setSavedId] = useState<string | null>(null);
  // Client deduplication nonce only, never used for identity or authorization.
  const [requestKey, setRequestKey] = useState(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const n = Math.floor(Math.random() * 16); return (c === 'x' ? n : (n & 3) | 8).toString(16); }));
  const dirty = !savedId && !!(content.name || content.phone || content.message || content.preferredTime || (content.kind === 'VISIT' && content.location));
  const cache = useDraftCache(`care:${kind}`, { content, requestKey }, dirty);
  useEffect(() => { const restored = cache.restored; if (restored) { Promise.resolve().then(() => { setContent(restored.content); setRequestKey(restored.requestKey); }); } }, [cache.restored]);
  useEffect(() => { if (savedId) router.dismissTo({ pathname: '/care/[id]', params: { id: savedId } }); }, [savedId]);
  const patch = (value: Partial<CareInput>) => { setContent(current => ({ ...current, ...value }) as CareInput); setConsent(false); };
  async function submit() {
    if (lock.current || !consent || !options.data?.care || !options.data.policy) return;
    lock.current = true; setBusy(true); setError('');
    try { const item = await extras.careCreate({ content, consent: true, policyVersion: options.data.carePolicyVersion ?? options.data.policy.version, requestKey }); cache.clear(); setSavedId(item.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '요청하지 못했습니다. 입력은 유지됩니다.'); }
    finally { setBusy(false); lock.current = false; }
  }
  return <AppScreen title={review ? '상담·심방 요청 확인' : kind === 'VISIT' ? '심방 요청' : '목회상담 요청'} onBack={() => review ? setReview(false) : router.canGoBack() ? router.back() : router.replace('/care')}>
    {options.loading && <ActivityIndicator accessibilityLabel="접수 안내를 불러오는 중" />}{!!options.error && <Failure message={options.error} retry={options.reload} />}
    {options.data && !options.data.care && <IntroCard title="온라인 접수 준비 중">담당자와 개인정보 안내가 확정되면 접수가 열립니다. 현재 입력은 전달되지 않습니다.</IntroCard>}
    {!review ? <>
      <FormField label="이름" value={content.name} onChangeText={name => patch({ name })} maxLength={80} />
      <FormField label="연락받을 번호" value={content.phone} onChangeText={phone => patch({ phone })} keyboardType="phone-pad" maxLength={30} />
      {content.kind === 'COUNSELING' ? <Choice label="상담 방식 · 희망" value={content.method} options={[["PHONE", "전화"], ["IN_PERSON", "대면"], ["DISCUSS", "협의"]]} onChange={method => patch({ method: method as 'PHONE' | 'IN_PERSON' | 'DISCUSS' })} /> : <Choice label="희망 장소" value={content.place} options={[["HOME", "가정"], ["CHURCH", "교회"], ["OTHER", "그 외"], ["DISCUSS", "협의"]]} onChange={place => patch({ place: place as 'HOME' | 'CHURCH' | 'OTHER' | 'DISCUSS' })} />}
      <FormField label={kind === 'VISIT' ? '희망 날짜·시간 · 선택' : '연락 가능한 시간 · 선택'} value={content.preferredTime} onChangeText={preferredTime => patch({ preferredTime })} maxLength={200} />
      {content.kind === 'VISIT' && <FormField label="방문 위치 · 선택" value={content.location} onChangeText={location => patch({ location })} maxLength={300} placeholder="상세 주소는 연락할 때 알려주셔도 돼요." />}
      <FormField label="전달할 이야기 · 선택" value={content.message} onChangeText={message => patch({ message })} multiline maxLength={4000} placeholder="자세한 사정은 상담할 때 이야기하셔도 괜찮아요." />
      <IntroCard title="필요한 정보만 작성해 주세요">요청은 예약 확정이 아닙니다. 전달 범위와 보관 안내를 다음 화면에서 확인하세요.</IntroCard>
      <Action title="요청 내용 확인" onPress={() => { const parsed = careInputSchema.safeParse(content); if (!parsed.success) { setError('이름과 연락받을 번호를 확인해 주세요.'); return; } setContent(parsed.data); setError(''); setReview(true); }} />
    </> : <>
      <CareContent content={content} />
      <IntroCard title="수신 범위와 보관 안내">{options.data?.policy?.care ?? '담당자와 보관 기준은 확정 전입니다. 아직 전송할 수 없습니다.'}</IntroCard>
      <Check label="접수·연락을 위한 전달에 동의합니다" value={consent} onChange={setConsent} disabled={busy || !options.data?.care} />
      <Action title={busy ? '요청 중' : '요청 보내기'} disabled={busy || !consent || !options.data?.care} onPress={() => void submit()} />
      <MenuCard title="내용 수정" onPress={() => { if (!busy) setReview(false); }} />
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.caption}>{error}</Text>}
    <ReauthAction error={error} returnTo={`/care/new?kind=${kind}`} />
    <DraftGuard dirty={dirty} busy={busy} onDiscard={cache.clear} />
  </AppScreen>;
}
function CareContent({ content }: { content: CareInput }) {
  const method = content.kind === 'COUNSELING' ? { PHONE: '전화', IN_PERSON: '대면', DISCUSS: '협의' }[content.method] : { HOME: '가정', CHURCH: '교회', OTHER: '그 외', DISCUSS: '협의' }[content.place];
  return <><Card title="요청 종류와 연락 정보">{content.kind === 'VISIT' ? '심방' : '목회상담'} · {content.name}{'\n'}{content.phone} · {method}</Card><Card title="희망 일정과 전달 내용">{content.preferredTime || '일정 협의'}{content.kind === 'VISIT' && content.location ? `\n${content.location}` : ''}{'\n'}{content.message || '전달 내용 없음'}</Card></>;
}
export function CareList() { return <MemberGate returnTo="/care/requests"><CareListContent /></MemberGate>; }
function CareListContent() {
  const { extras } = useMemberSession(); const { data, error, loading, reload, more } = usePagedResource(useCallback((page, signal) => extras.careList(page, signal), [extras]));
  return <AppScreen title="내 상담·심방 요청" onBack={() => router.dismissTo('/my')}><Action title="상담·심방 요청하기" onPress={() => router.push('/care')} />
    {loading && <ActivityIndicator accessibilityLabel="요청 내역을 불러오는 중" />}{!!error && <Failure message={error} retry={data ? more : reload} />}
    {data && !data.data.length && <Card title="요청 내역이 없습니다">작성한 요청을 여기에서 확인할 수 있습니다.</Card>}
    {data?.data.map(item => <MenuCard key={item.id} title={item.content.kind === 'VISIT' ? '심방 요청' : '목회상담 요청'} description={`${careStatusLabels[item.status]} · ${noticeDate(item.createdAt)}`} onPress={() => router.push({ pathname: '/care/[id]', params: { id: item.id } })} />)}
    {data?.nextPage != null && <Action title="요청 더 보기" disabled={loading} onPress={more} />}
  </AppScreen>;
}
export function CareDetail() { const { id } = useLocalSearchParams<{ id: string }>(); return <MemberGate returnTo={`/care/${id}`}><CareDetailContent id={id} /></MemberGate>; }
function CareDetailContent({ id }: { id: string }) {
  const { extras } = useMemberSession(); const { data, loading, error, reload } = useNoticeResource(useCallback(signal => extras.careDetail(id, signal), [id, extras])); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [mutationError, setMutationError] = useState(''); const lock = useRef(false);
  async function cancel() { if (!data || lock.current) return; lock.current = true; setBusy(true); setMutationError(''); try { await extras.careCancel(id, data.version); setConfirm(false); await reload(); } catch (cause) { setConfirm(false); setMutationError(cause instanceof Error ? cause.message : '취소하지 못했습니다.'); } finally { setBusy(false); lock.current = false; } }
  return <AppScreen title="상담·심방 요청 상세" onBack={() => router.dismissTo('/care/requests')}>
    {loading && <ActivityIndicator accessibilityLabel="요청 내용을 불러오는 중" />}{!!error && <Failure message={error} retry={reload} />}
    {data && <><IntroCard title={data.status === 'CANCELLED' ? '요청을 취소했습니다' : '내 요청 상태'}>{careStatusLabels[data.status]}</IntroCard><CareContent content={data.content} />
      {!['COMPLETED', 'CANCELLED'].includes(data.status) && <Action title="요청 취소" disabled={busy} onPress={() => setConfirm(true)} />}</>}
    {!!mutationError && <Text accessibilityRole="alert" style={styles.caption}>{mutationError}</Text>}<MenuCard title="교회에 연락하기" description="연락처 보기" onPress={() => router.push('/church-info/contact')} />
    <ConfirmDialog busy={busy} visible={confirm} title="요청을 취소할까요?" message="요청이 취소 상태로 바뀝니다." confirmLabel={busy ? '취소 중' : '요청 취소하기'} onCancel={() => { if (!busy) setConfirm(false); }} onConfirm={() => void cancel()} />
  </AppScreen>;
}
