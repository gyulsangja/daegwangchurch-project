import { randomUUID } from "node:crypto";

import { appWorshipListSchema } from "@daegwang/contracts/features/worship/app-contract";
import { InvalidCursorError, type createAppWorshipQueries } from "@daegwang/server/features/worship/app-query-core";

type Queries = ReturnType<typeof createAppWorshipQueries>;
export function createAppWorshipHandlers(getQueries: () => Queries, enabled: () => boolean) {
  const headers = { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "X-Content-Type-Options": "nosniff" };
  function error(status: number, code: string, message: string, requestId: string) {
    return Response.json({ error: { code, message, requestId } }, { status, headers });
  }
  async function handle(read: () => Promise<Response>) {
    const requestId = randomUUID();
    if (!enabled()) return error(503, "SERVICE_UNAVAILABLE", "말씀 서비스를 준비하고 있습니다.", requestId);
    try { return await read(); }
    catch (cause) {
      if (cause instanceof InvalidCursorError) return error(422, "INVALID_CURSOR", "목록을 처음부터 다시 불러와 주세요.", requestId);
      // Do not expose database errors, credentials, or unpublished payloads.
      console.error("App worship read failed", { requestId });
      return error(503, "SERVICE_UNAVAILABLE", "말씀을 불러오지 못했습니다. 다시 시도해 주세요.", requestId);
    }
  }
  return {
    list(request: Request) {
      return handle(async () => {
        const params = new URL(request.url).searchParams;
        const query = Object.fromEntries(params);
        const parsed = appWorshipListSchema.safeParse(query);
        if (!parsed.success || [...params.keys()].some((key) => params.getAll(key).length > 1)) {
          return error(422, "INVALID_INPUT", "조회 조건을 확인해 주세요.", randomUUID());
        }
        return Response.json(await getQueries().list(parsed.data), { headers });
      });
    },
    detail(id: string) {
      return handle(async () => {
        if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return error(404, "NOT_FOUND", "말씀을 찾을 수 없습니다.", randomUUID());
        const data = await getQueries().detail(id);
        return data ? Response.json({ data }, { headers }) : error(404, "NOT_FOUND", "말씀을 찾을 수 없습니다.", randomUUID());
      });
    },
  };
}
