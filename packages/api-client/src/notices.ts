import { z } from 'zod';
import { noticeSchema, noticePageSchema } from '@daegwang/contracts/features/notices/app-contract';
import { ApiError } from './worship';
export type { Notice, NoticePage } from '@daegwang/contracts/features/notices/app-contract';

export function createNoticeClient(baseUrl: string | undefined, fetcher: typeof fetch = fetch, resource: 'notices' | 'prayers' = 'notices') {
  const label = resource === 'prayers' ? '공동기도' : '공지';
  const readError = resource === 'prayers' ? '공동기도 내용을 불러오지 못했습니다.' : '공지를 불러오지 못했습니다.';
  async function read(path: string, signal?: AbortSignal): Promise<unknown> {
    if (!baseUrl) throw new ApiError(0, '서비스 연결 주소가 설정되지 않았습니다.');
    let base: URL;
    try { base = new URL(baseUrl); } catch { throw new ApiError(0, '서비스 연결 주소를 확인해 주세요.'); }
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new ApiError(0, '서비스 연결 주소를 확인해 주세요.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 15000);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/api/v1/${resource}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new ApiError(response.status, response.status === 404 ? `현재 공개되지 않은 ${label}입니다.` : `${readError} 다시 시도해 주세요.`);
      return await response.json();
    } catch (cause) {
      if (signal?.aborted || cause instanceof ApiError) throw cause;
      throw new ApiError(0, `${readError} 인터넷 연결을 확인해 주세요.`);
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    async list(page = 0, signal?: AbortSignal) {
      const result = noticePageSchema.safeParse(await read(`?page=${page}`, signal));
      if (!result.success) throw new ApiError(0, `${label} 정보의 형식을 확인할 수 없습니다.`);
      return result.data;
    },
    async detail(id: string, signal?: AbortSignal) {
      const result = z.object({ data: noticeSchema }).safeParse(await read(`/${encodeURIComponent(id)}`, signal));
      if (!result.success) throw new ApiError(0, `${label} 정보의 형식을 확인할 수 없습니다.`);
      return result.data.data;
    },
  };
}
