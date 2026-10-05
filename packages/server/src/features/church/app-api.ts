import type { createAppChurchQueries } from './app-query-core';
export function createAppChurchHandler(getQueries: () => ReturnType<typeof createAppChurchQueries>, enabled: () => boolean) {
  const headers = { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'X-Content-Type-Options': 'nosniff' };
  const error = (status: number) => Response.json({ error: { message: status === 404 ? '현재 공개된 안내가 없습니다.' : '교회 안내를 불러오지 못했습니다. 다시 시도해 주세요.' } }, { status, headers });
  return async (section: string) => {
    if (!['about', 'schedules', 'pastor', 'newcomer', 'contact'].includes(section)) return error(404);
    if (!enabled()) return error(503);
    try {
      const queries = getQueries();
      const data = await queries[section as keyof typeof queries]();
      return data === null ? error(404) : Response.json({ data }, { headers });
    } catch { console.error('App church read failed'); return error(503); }
  };
}
