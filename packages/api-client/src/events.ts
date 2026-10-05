import { z } from 'zod';
import { eventSchema, eventPageSchema } from '@daegwang/contracts/features/events/app-contract';
import { ApiError } from './worship';
export type { ChurchEvent, Event, EventPage } from '@daegwang/contracts/features/events/app-contract';

export function createEventClient(baseUrl: string | undefined, fetcher: typeof fetch = fetch) {
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
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/api/v1/events${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new ApiError(response.status, response.status === 404 ? '현재 공개되지 않은 행사입니다.' : '행사를 불러오지 못했습니다. 다시 시도해 주세요.');
      return await response.json();
    } catch (cause) {
      if (signal?.aborted || cause instanceof ApiError) throw cause;
      throw new ApiError(0, '행사를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    async list(page = 0, period: 'upcoming' | 'past' = 'upcoming', signal?: AbortSignal, date?: string, month?: string) {
      const result = eventPageSchema.safeParse(await read(`?page=${page}&period=${period}${date ? `&date=${encodeURIComponent(date)}` : ''}${month ? `&month=${encodeURIComponent(month)}` : ''}`, signal));
      if (!result.success) throw new ApiError(0, '행사 정보의 형식을 확인할 수 없습니다.');
      return result.data;
    },
    async detail(id: string, signal?: AbortSignal) {
      const result = z.object({ data: eventSchema }).safeParse(await read(`/${encodeURIComponent(id)}`, signal));
      if (!result.success) throw new ApiError(0, '행사 정보의 형식을 확인할 수 없습니다.');
      return result.data.data;
    },
  };
}
