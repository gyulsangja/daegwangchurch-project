import { z } from 'zod';
import { careCreateSchema, carePageSchema, careSchema, memberOptionsSchema, notificationPageSchema, notificationSchema, preferenceInputSchema, preferenceSchema, profileSchema, signupSchema, resetPasswordSchema } from '@daegwang/contracts/features/member/extras';
import { createMemberTransport, decodeMemberResponse as decode } from './member';
import { ApiError } from './worship';
import { groupSnapshotSchema, groupPreferenceSchema } from '@daegwang/contracts/features/member/groups';

export function createAccountClient(base: string | undefined, fetcher: typeof fetch = fetch) {
  async function request(path: string, body?: unknown, signal?: AbortSignal) {
    let url: URL; try { url = new URL(base ?? ''); } catch { throw new ApiError(0, '계정 서비스 연결을 준비하고 있습니다.'); }
    if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname)))) throw new ApiError(0, '계정 서비스 연결 주소를 확인해 주세요.');
    const controller = new AbortController(); const abort = () => controller.abort(); signal?.addEventListener('abort', abort); if (signal?.aborted) abort(); const timer = setTimeout(abort, 15000);
    try {
      const response = await fetcher(`${url.href.replace(/\/$/, '')}/api/v1/account/${path}`, { method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal, headers: body ? { 'Content-Type': 'application/json' } : { Accept: 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      if (!response.ok) throw new ApiError(response.status, response.status === 429 ? '잠시 기다린 뒤 다시 시도해 주세요.' : response.status === 503 ? '계정 서비스의 운영 설정을 준비하고 있습니다.' : '입력 내용이나 인증번호를 확인해 주세요.');
      return await response.json();
    } catch (cause) { if (cause instanceof ApiError || signal?.aborted) throw cause; throw new ApiError(0, '처리 결과를 확인하지 못했습니다. 연결 상태를 확인해 주세요.'); }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    options: async (signal?: AbortSignal) => decode(memberOptionsSchema, await request('options', undefined, signal)),
    signup: (input: z.input<typeof signupSchema>) => request('signup', signupSchema.parse(input)),
    verify: (email: string, code: string) => request('verify', { email, code }),
    resend: (email: string) => request('resend', { email }),
    recover: (email: string) => request('recovery', { email }),
    reset: (input: z.input<typeof resetPasswordSchema>) => request('reset', resetPasswordSchema.parse(input)),
  };
}
export function createMemberExtrasClient(base: string | undefined, token: () => Promise<string | null>, fetcher: typeof fetch = fetch) {
  const care = createMemberTransport(base, token, 'requests', fetcher);
  const alerts = createMemberTransport(base, token, 'notifications', fetcher);
  const prefs = createMemberTransport(base, token, 'preferences', fetcher);
  const profile = createMemberTransport(base, token, 'profile', fetcher);
  const groups = createMemberTransport(base, token, 'groups', fetcher);
  return {
    groups: async (signal?: AbortSignal) => decode(z.object({ data: groupSnapshotSchema }), await groups('', 'GET', undefined, signal)).data,
    saveGroups: async (input: z.infer<typeof groupPreferenceSchema>) => decode(z.object({ data: groupSnapshotSchema }), await groups('', 'PATCH', groupPreferenceSchema.parse(input))).data,
    careList: async (page = 0, signal?: AbortSignal) => decode(carePageSchema, await care(`?page=${page}`, 'GET', undefined, signal)),
    careDetail: async (id: string, signal?: AbortSignal) => decode(z.object({ data: careSchema }), await care(`/${encodeURIComponent(id)}`, 'GET', undefined, signal)).data,
    careCreate: async (input: z.input<typeof careCreateSchema>) => decode(z.object({ data: careSchema }), await care('', 'POST', careCreateSchema.parse(input))).data,
    careCancel: async (id: string, version: number) => decode(z.object({ data: careSchema }), await care(`/${encodeURIComponent(id)}`, 'PATCH', { version, action: 'CANCEL' })).data,
    notifications: async (page = 0, category = 'ALL', signal?: AbortSignal) => decode(notificationPageSchema, await alerts(`?page=${page}&category=${encodeURIComponent(category)}`, 'GET', undefined, signal)),
    notification: async (id: string, signal?: AbortSignal) => decode(z.object({ data: notificationSchema }), await alerts(`/${encodeURIComponent(id)}`, 'GET', undefined, signal)).data,
    markRead: async (id: string) => { await alerts(`/${encodeURIComponent(id)}`, 'PATCH', { read: true }); },
    preferences: async (signal?: AbortSignal) => decode(z.object({ data: preferenceSchema }), await prefs('', 'GET', undefined, signal)).data,
    savePreferences: async ({ version, ...content }: z.infer<typeof preferenceSchema>) => decode(z.object({ data: preferenceSchema }), await prefs('', 'PATCH', { version, content: preferenceInputSchema.parse(content) })).data,
    profile: async (signal?: AbortSignal) => decode(z.object({ data: profileSchema }), await profile('', 'GET', undefined, signal)).data,
    saveProfile: async (displayName: string, version: number) => decode(z.object({ data: profileSchema }), await profile('', 'PATCH', { displayName, version })).data,
    deleteAccount: async (password: string, policyVersion: string) => {
      try {
        const response = await profile('', 'DELETE', { password, policyVersion, confirm: 'DELETE' });
        // The isolated preview retains its legacy 204 response; production returns explicit acceptance.
        if (response !== null) decode(z.object({ data: z.object({ status: z.literal('accepted') }) }), response);
      }
      catch (cause) {
        if (cause instanceof ApiError) {
          const messages: Record<number, string> = { 0: '접수 결과를 확인하지 못했습니다. 다시 로그인해 계정 상태를 확인해 주세요.', 403: '관리자 계정은 앱에서 탈퇴할 수 없습니다.', 409: '탈퇴 안내가 변경되었습니다. 화면을 다시 열어 확인해 주세요.', 422: '현재 비밀번호를 확인해 주세요.', 429: '시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요.', 503: '탈퇴 요청 결과를 확인하지 못했습니다. 잠시 후 계정 상태를 확인해 주세요.' };
          throw new ApiError(cause.status, messages[cause.status] ?? cause.message);
        }
        throw cause;
      }
    },
  };
}
