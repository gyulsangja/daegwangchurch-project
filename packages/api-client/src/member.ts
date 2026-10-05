import { z } from 'zod';
import { memberRecordInputSchema, memberRecordListSchema, memberRecordPageSchema, memberRecordSchema, memberRecordUpdateSchema, type MemberRecordInput } from '@daegwang/contracts/features/member/records';
import { ApiError } from './worship';
export type { MemberRecord, MemberRecordInput } from '@daegwang/contracts/features/member/records';

export function createMemberTransport(baseUrl: string | undefined, accessToken: () => Promise<string | null>, resource: 'records' | 'bookmarks' | 'schedules' | 'requests' | 'notifications' | 'preferences' | 'profile' | 'groups' | 'push-devices', fetcher: typeof fetch = fetch) {
  async function request(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<unknown> {
    let base: URL;
    try { base = new URL(baseUrl ?? ''); } catch { throw new ApiError(0, '서비스 연결 주소가 설정되지 않았습니다.'); }
    const local = ['localhost', '127.0.0.1', '10.0.2.2', '[::1]'].includes(base.hostname);
    if ((base.protocol !== 'https:' && !(local && base.protocol === 'http:')) || base.username || base.password || base.search || base.hash) throw new ApiError(0, '개인 기록은 HTTPS 연결이 필요합니다.');
    const token = await accessToken();
    if (!token) throw new ApiError(401, '로그인이 필요합니다.');
    const controller = new AbortController(); const abort = () => controller.abort();
    signal?.addEventListener('abort', abort); if (signal?.aborted) abort();
    const timer = setTimeout(abort, 15000);
    try {
      const response = await fetcher(`${base.href.replace(/\/$/, '')}/api/v1/me/${resource}${path}`, { method, signal: controller.signal, cache: 'no-store', credentials: 'omit', redirect: 'error', headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
      if (!response.ok) {
        const messages: Record<number, string> = { 401: '로그인이 만료되었습니다. 다시 로그인해 주세요.', 403: '접근할 수 없습니다. 연결 설정을 확인해 주세요.', 404: '기록 또는 연결된 말씀을 찾을 수 없습니다.', 409: '다른 곳에서 수정된 기록입니다. 입력 내용을 보관한 뒤 다시 불러와 주세요.', 422: '입력 내용을 확인해 주세요.', 503: '개인 기록 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.' };
        throw new ApiError(response.status, messages[response.status] ?? '기록을 처리하지 못했습니다.');
      }
      return response.status === 204 ? null : await response.json();
    } catch (cause) {
      if (signal?.aborted || cause instanceof ApiError) throw cause;
      throw new ApiError(0, method === 'GET' ? '기록을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.' : '저장 결과를 확인할 수 없습니다. 입력 내용을 보관하고 목록에서 확인해 주세요.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return request;
}
export const decodeMemberResponse = <T>(schema: z.ZodType<T>, data: unknown): T => { const parsed = schema.safeParse(data); if (!parsed.success) throw new ApiError(0, '기록 응답 형식을 확인할 수 없습니다.'); return parsed.data; };
export function createMemberClient(baseUrl: string | undefined, accessToken: () => Promise<string | null>, fetcher: typeof fetch = fetch) {
  const request = createMemberTransport(baseUrl, accessToken, 'records', fetcher); const decode = decodeMemberResponse;
  return {
    async list(input: z.input<typeof memberRecordListSchema> = {}, signal?: AbortSignal) { const query = memberRecordListSchema.parse(input); const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])); return decode(memberRecordPageSchema, await request(`?${params}`, 'GET', undefined, signal)); },
    async detail(id: string, signal?: AbortSignal) { return decode(z.object({ data: memberRecordSchema }), await request(`/${encodeURIComponent(id)}`, 'GET', undefined, signal)).data; },
    async create(content: MemberRecordInput) { return decode(z.object({ data: memberRecordSchema }), await request('', 'POST', memberRecordInputSchema.parse(content))).data; },
    async update(id: string, version: number, content: MemberRecordInput) { return decode(z.object({ data: z.object({ id: z.string(), version: z.number().int().positive() }) }), await request(`/${encodeURIComponent(id)}`, 'PATCH', memberRecordUpdateSchema.parse({ version, content }))).data; },
    async remove(id: string, version: number) { await request(`/${encodeURIComponent(id)}`, 'DELETE', { version }); },
  };
}
