import { eventListQuerySchema } from '@daegwang/contracts/features/events/app-contract';
import type { createAppEventQueries } from './app-query-core';

export function createAppEventHandlers(getQueries: () => ReturnType<typeof createAppEventQueries>, enabled: () => boolean) {
  const headers = { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' };
  const error = (status: number) => Response.json({ error: { message: status === 404 ? '현재 공개되지 않은 행사입니다.' : status === 422 ? '조회 조건을 확인해 주세요.' : '행사를 불러오지 못했습니다. 다시 시도해 주세요.' } }, { status, headers });
  async function handle(read: () => Promise<Response>) {
    if (!enabled()) return error(503);
    try { return await read(); }
    catch { console.error('App event read failed'); return error(503); }
  }
  return {
    list(request: Request) { return handle(async () => {
      const params = new URL(request.url).searchParams;
      const parsed = eventListQuerySchema.safeParse(Object.fromEntries(params));
      if (!parsed.success || [...params.keys()].some(key => params.getAll(key).length > 1)) return error(422);
      return Response.json(await getQueries().list(parsed.data.page, parsed.data.period, parsed.data.date, parsed.data.month), { headers });
    }); },
    detail(id: string) { return handle(async () => {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return error(404);
      const data = await getQueries().detail(id);
      return data ? Response.json({ data }, { headers }) : error(404);
    }); },
  };
}
