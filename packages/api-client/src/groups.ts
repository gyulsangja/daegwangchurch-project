import { z } from 'zod';
import { groupSchema, groupNoticeSchema } from '@daegwang/contracts/features/member/groups';
import { ApiError } from './worship';
const schema = z.object({ data: z.object({ groups: z.array(groupSchema), notices: z.array(groupNoticeSchema.extend({ audience: z.literal('PUBLIC') })) }) });
export function createPublicGroupClient(baseUrl: string | undefined, fetcher: typeof fetch = fetch) {
  return async (signal?: AbortSignal) => {
    let base: URL; try { base = new URL(baseUrl ?? ''); } catch { throw new ApiError(0, '모임 소식 연결 주소를 확인해 주세요.'); }
    if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new ApiError(0, '모임 소식 연결 주소를 확인해 주세요.');
    const controller = new AbortController(); const abort = () => controller.abort(); signal?.addEventListener('abort', abort); if (signal?.aborted) controller.abort(); const timer = setTimeout(abort, 15000);
    try { const response = await fetcher(`${base.href.replace(/\/$/, '')}/api/v1/groups`, { signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error' }); if (!response.ok) throw new ApiError(response.status, '모임 소식 연결을 준비하고 있습니다.'); return schema.parse(await response.json()).data; }
    catch (cause) { if (signal?.aborted || cause instanceof ApiError) throw cause; throw new ApiError(0, '모임 소식을 불러오지 못했습니다.'); }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  };
}
