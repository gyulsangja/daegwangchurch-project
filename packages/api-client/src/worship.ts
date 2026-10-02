import { z } from 'zod';
import { appWorshipSchema as itemSchema, appWorshipPageSchema as pageSchema } from '@daegwang/contracts/features/worship/app-contract';
export type Worship = z.infer<typeof itemSchema>;
export type WorshipPage = z.infer<typeof pageSchema>;
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function createWorshipClient(baseUrl: string | undefined, fetcher: typeof fetch = fetch) {
  async function read(path: string, signal?: AbortSignal): Promise<unknown> {
    if (!baseUrl) throw new ApiError(0, '서비스 연결 주소가 설정되지 않았습니다.');
    const base = new URL(baseUrl);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
      throw new ApiError(0, '서비스 연결 주소를 확인해 주세요.');
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 15000);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/api/v1/worship${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new ApiError(response.status, response.status === 404
        ? '현재 공개되지 않은 말씀입니다.' : response.status === 503
          ? '말씀을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.' : '조회 조건을 확인하고 다시 시도해 주세요.');
      return await response.json();
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, '연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    async list(options: { month?: string; cursor?: string; signal?: AbortSignal } = {}): Promise<WorshipPage> {
      const params = new URLSearchParams({ type: 'FIRST_HOUR', limit: '20' });
      if (options.month) params.set('month', options.month);
      if (options.cursor) params.set('cursor', options.cursor);
      const parsed = pageSchema.safeParse(await read(`?${params}`, options.signal));
      if (!parsed.success) throw new ApiError(0, '말씀 정보의 형식을 확인할 수 없습니다. 다시 시도해 주세요.');
      return parsed.data;
    },
    async detail(id: string, signal?: AbortSignal): Promise<Worship> {
      const parsed = z.object({ data: itemSchema }).safeParse(await read(`/${encodeURIComponent(id)}`, signal));
      if (!parsed.success) throw new ApiError(0, '말씀 정보의 형식을 확인할 수 없습니다. 다시 시도해 주세요.');
      return parsed.data.data;
    },
  };
}
