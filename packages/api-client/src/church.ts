import { z } from 'zod';
import { churchAboutSchema, churchSchedulesSchema, churchPastorSchema, churchNewcomerSchema, churchContactSchema } from '@daegwang/contracts/features/church/app-contract';
import { ApiError } from './worship';
export function createChurchClient(baseUrl: string | undefined, fetcher: typeof fetch = fetch) {
  async function read<T>(section: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
    if (!baseUrl) throw new ApiError(0, '서비스 연결 주소가 설정되지 않았습니다.');
    let base: URL;
    try { base = new URL(baseUrl); } catch { throw new ApiError(0, '서비스 연결 주소를 확인해 주세요.'); }
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new ApiError(0, '서비스 연결 주소를 확인해 주세요.');
    const controller = new AbortController(); const abort = () => controller.abort();
    signal?.addEventListener('abort', abort); if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 15000);
    try {
      const response = await fetcher(`${baseUrl.replace(/\/$/, '')}/api/v1/church/${section}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new ApiError(response.status, response.status === 404 ? '현재 공개된 안내가 없습니다.' : '교회 안내를 불러오지 못했습니다. 다시 시도해 주세요.');
      const result = z.object({ data: schema }).safeParse(await response.json());
      if (!result.success) throw new ApiError(0, '교회 안내 정보의 형식을 확인할 수 없습니다.');
      return result.data.data;
    } catch (cause) {
      if (signal?.aborted || cause instanceof ApiError) throw cause;
      throw new ApiError(0, '교회 안내를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return { about: (signal?: AbortSignal) => read('about', churchAboutSchema, signal), schedules: (signal?: AbortSignal) => read('schedules', churchSchedulesSchema, signal), pastor: (signal?: AbortSignal) => read('pastor', churchPastorSchema, signal), newcomer: (signal?: AbortSignal) => read('newcomer', churchNewcomerSchema, signal), contact: (signal?: AbortSignal) => read('contact', churchContactSchema, signal) };
}
