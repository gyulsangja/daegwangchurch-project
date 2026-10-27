import type { ChurchDetails } from '@daegwang/contracts/features/member/church-membership';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { router, type Href } from 'expo-router';
import { createMemberAuth, type Session } from '@daegwang/api-client/member-auth';
import { createMemberClient } from '@daegwang/api-client/member';
import { createBookmarkClient } from '@daegwang/api-client/bookmarks';
import { createScheduleClient } from '@daegwang/api-client/schedules';
import { createMemberExtrasClient } from '@daegwang/api-client/member-extras';
import { createPushClient } from '@daegwang/api-client/push';
import { disableDevicePush } from '../lib/device-push';
import { AppScreen, IntroCard } from './app-screen';
import { draftCache } from '../lib/draft-cache';
import { Action } from './ui';
import { authenticateSocial } from '../lib/social-auth';
import { AppState, Platform, ActivityIndicator } from 'react-native';
import { sessionStorage } from '../lib/session-storage';

const sessionKey = 'daegwang-member-session-v1';
const auth = createMemberAuth(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { storage: sessionStorage, storageKey: sessionKey, useProcessLock: Platform.OS !== 'web' });
type SessionContext = { restoring:boolean; session: Session | null; configured: boolean; client: ReturnType<typeof createMemberClient>; bookmarks: ReturnType<typeof createBookmarkClient>; schedules: ReturnType<typeof createScheduleClient>; extras: ReturnType<typeof createMemberExtrasClient>; push: ReturnType<typeof createPushClient>; signIn: (email: string, password: string) => Promise<void>; signInSocial: (provider: 'google' | 'kakao', input: { displayName: string; consent: true; ageConfirmed: true; policyVersion: string; churchRequest?: ChurchDetails }) => Promise<boolean>; signOut: () => Promise<void> };
const Context = createContext<SessionContext | null>(null);
export function MemberSessionProvider({ children }: PropsWithChildren) {
  const [restoring, setRestoring] = useState(!!auth);
  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<Session | null>(null);
  const signingOut = useRef(false);
  useEffect(() => {
    const listener = auth?.onAuthStateChange((_event, next) => {
      if (current.current && !next && !signingOut.current) void disableDevicePush().catch(() => {});
      current.current = signingOut.current || next?.user.is_anonymous ? null : next;
      if (current.current) draftCache.activate(current.current.user.id); else draftCache.clear(); setSession(current.current);
      setRestoring(false);
    });
    const updateRefresh = (state: string) => { if (state === 'active') void auth?.startAutoRefresh(); else void auth?.stopAutoRefresh(); };
    if (Platform.OS !== 'web') updateRefresh(AppState.currentState);
    const lifecycle = Platform.OS !== 'web' ? AppState.addEventListener('change', updateRefresh) : undefined;
    return () => { listener?.data.subscription.unsubscribe(); lifecycle?.remove(); if (Platform.OS !== 'web') void auth?.stopAutoRefresh(); };
  }, []);
  const getToken = useCallback(async () => {
    if (!auth || !current.current) return null;
    const userId = current.current.user.id;
    const { data, error } = await auth.getSession();
    if (error || !data.session || data.session.user.is_anonymous || current.current?.user.id !== userId || data.session.user.id !== userId) return null;
    return data.session.access_token;
  }, []);
  // The factory stores this callback; it is called only by async HTTP requests, never during render.
  // eslint-disable-next-line react-hooks/refs
  const client = useMemo(() => createMemberClient(process.env.EXPO_PUBLIC_API_BASE_URL, getToken), [getToken]);
  // Deferred token callback, as above.
  // eslint-disable-next-line react-hooks/refs
  const bookmarks = useMemo(() => createBookmarkClient(process.env.EXPO_PUBLIC_API_BASE_URL, getToken), [getToken]);
  // Deferred token callback, as above.
  // eslint-disable-next-line react-hooks/refs
  const schedules = useMemo(() => createScheduleClient(process.env.EXPO_PUBLIC_API_BASE_URL, getToken), [getToken]);
  // Factory stores the deferred token callback; it does not read the session during render.
  // eslint-disable-next-line react-hooks/refs
  const extras = useMemo(() => createMemberExtrasClient(process.env.EXPO_PUBLIC_API_BASE_URL, getToken), [getToken]);
  // Factory keeps the token callback for later HTTP requests.
  // eslint-disable-next-line react-hooks/refs
  const push = useMemo(() => createPushClient(process.env.EXPO_PUBLIC_API_BASE_URL, getToken), [getToken]);
  const value: SessionContext = { restoring, session, client, bookmarks, schedules, extras, push, configured: !!auth,
    async signInSocial(provider, input) {
      if (!auth) throw new Error('로그인 연결을 준비하고 있습니다.');
      const next = await authenticateSocial(provider, input);
      if (!next) return false;
      const { data, error } = await auth.setSession({ access_token: next.access_token, refresh_token: next.refresh_token });
      if (error || !data.session) throw new Error('로그인을 완료하지 못했습니다.');
      draftCache.activate(data.session.user.id); current.current = data.session; setSession(data.session); return true;
    },
    async signIn(email, password) {
      if (!auth) throw new Error('로그인 연결 설정이 아직 준비되지 않았습니다.');
      const { data, error } = await auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session || data.user?.is_anonymous) throw new Error(error?.status === 429 ? '잠시 기다린 뒤 다시 로그인해 주세요.' : '이메일과 비밀번호를 확인해 주세요. 연결이 불안정한 경우 잠시 후 다시 시도해 주세요.');
      draftCache.activate(data.session.user.id); current.current = data.session; setSession(data.session);
    },
    async signOut() {
      // Clear all private screens immediately, including when the network is down.
      draftCache.clear(); signingOut.current = true; current.current = null; setSession(null);
      try {
        const [, result] = await Promise.all([disableDevicePush(), auth?.signOut({ scope: 'local' })]);
        if (result?.error) throw new Error('Sign out failed');
      } catch { throw new Error('이 기기의 개인 화면은 닫았습니다. 서버 로그아웃 또는 푸시 해제를 완료하지 못했습니다. 연결 후 다시 확인하거나 휴대폰 설정에서 알림을 꺼 주세요.'); }
      finally {
        // An expired session can fail to refresh while offline before signOut
        // reaches its cleanup. Never restore that session on the next launch.
        try { await sessionStorage.removeItem(sessionKey); }
        finally { current.current = null; setSession(null); signingOut.current = false; }
      }
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMemberSession() { const value = useContext(Context); if (!value) throw new Error('MemberSessionProvider required'); return value; }
export function safeMemberReturn(value?: string): Href {
  if (value && /^\/records(?:\/new)?\?/.test(value)) {
    const url = new URL(value, 'https://app.invalid');
    const valid = [...url.searchParams].every(([key, item]) => url.searchParams.getAll(key).length === 1 && (key === 'kind' ? ['REFLECTION', 'PRAYER', 'SPECIAL_PRAYER'].includes(item) : key === 'date' ? /^\d{4}-\d{2}-\d{2}$/.test(item) : ['worshipId','reflectionId','prayerTopicId'].includes(key) && /^[a-zA-Z0-9_-]{1,100}$/.test(item)));
    return valid && !url.hash ? value as Href : '/my';
  }
  if (value === '/groups') return '/groups';
  if (value && /^\/(records|schedules)\/edit\/[a-zA-Z0-9_-]+$/.test(value)) return value as Href;
  if (value && /^\/(account(?:\/(?:privacy|delete|church))?|notifications(?:\/(?:settings|[a-zA-Z0-9_-]+))?|care\/(?:requests|new(?:\?kind=(?:COUNSELING|VISIT))?|[a-zA-Z0-9_-]+))$/.test(value)) return value as Href;
  if (value && /^\/schedules\/new\?date=\d{4}-\d{2}-\d{2}$/.test(value)) return value as Href;
  if (value && /^\/(saved-worship|schedules(?:\/[a-zA-Z0-9_-]+)?|(?:devotional|sermons|events)\/[a-zA-Z0-9_-]+)$/.test(value)) return value as Href;
  return value && /^\/(my|records(?:\/[a-zA-Z0-9_-]+)?)(?:\?(?:kind=(?:REFLECTION|PRAYER|SPECIAL_PRAYER)|worshipId=[a-zA-Z0-9_-]+|reflectionId=[a-zA-Z0-9_-]+)(?:&(?:kind=(?:REFLECTION|PRAYER|SPECIAL_PRAYER)|worshipId=[a-zA-Z0-9_-]+|reflectionId=[a-zA-Z0-9_-]+))*)?$/.test(value) ? value as Href : '/my';
}
export function MemberGate({ children, returnTo = '/my' }: PropsWithChildren<{ returnTo?: string }>) {
  const { session, restoring } = useMemberSession();
  if (restoring) return <AppScreen title="나의 교회생활"><ActivityIndicator accessibilityLabel="저장된 로그인 확인 중" /></AppScreen>;
  if (!session) return <AppScreen title="회원 기능" onBack={() => router.replace('/my')}><IntroCard title="나만의 기록을 남겨보세요">개인 묵상과 기도를 이용하려면 로그인해 주세요.</IntroCard><Action title="로그인" onPress={() => router.push({ pathname: '/login', params: { returnTo: safeMemberReturn(returnTo) as string } })} /></AppScreen>;
  return <PrivateContent key={session.user.id}>{children}</PrivateContent>;
}
function PrivateContent({ children }: PropsWithChildren) { return <>{children}</>; }
