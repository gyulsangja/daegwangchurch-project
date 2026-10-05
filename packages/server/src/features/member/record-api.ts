import { z } from 'zod';
import { MemberRecordConflict, MemberRecordNotFound } from './record-service';
type Service = { list: (input: unknown) => Promise<unknown>; detail: (id: string) => Promise<unknown>; create: (input: unknown) => Promise<unknown>; update?: (id: string, input: unknown) => Promise<unknown>; remove: (id: string, input: unknown) => Promise<unknown> };
export function createMemberRecordHandler(dependencies: { enabled: () => boolean; authenticate: (token: string) => Promise<string | null>; service: (userId: string) => Service; allowedOrigins: () => string[] }) {
  return async (request: Request, id?: string) => {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' });
    const reply = (status: number, data: unknown) => Response.json(data, { status, headers });
    const error = (status: number, message: string) => reply(status, { error: { message } });
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin && !dependencies.allowedOrigins().includes(origin)) return error(403, '허용되지 않은 요청입니다.');
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS'); headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      return new Response(null, { status: 204, headers });
    }
    if (!dependencies.enabled()) return error(503, '개인 기록 서비스를 준비하고 있습니다.');
    const match = request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/);
    if (!match) return error(401, '로그인이 필요합니다.');
    try {
      const owner = await dependencies.authenticate(match[1]);
      if (!owner) return error(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');
      const service = dependencies.service(owner);
      if (id !== undefined && !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return error(404, '기록을 찾을 수 없습니다.');
      if (request.method === 'GET') {
        if (id) return reply(200, { data: await service.detail(id) });
        const params = new URL(request.url).searchParams;
        if ([...params.keys()].some(key => params.getAll(key).length > 1)) return error(422, '조회 조건을 확인해 주세요.');
        return reply(200, await service.list(Object.fromEntries(params)));
      }
      if (!((request.method === 'POST' && !id) || (['PATCH', 'DELETE'].includes(request.method) && id))) return error(405, '지원하지 않는 요청입니다.');
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return error(415, 'JSON 형식이 필요합니다.');
      const reader = request.body?.getReader(); if (!reader) return error(422, '내용을 입력해 주세요.');
      let size = 0; const chunks: Uint8Array[] = [];
      while (true) { const result = await reader.read(); if (result.done) break; size += result.value.byteLength; if (size > 262144) { await reader.cancel(); return error(413, '내용이 너무 깁니다.'); } chunks.push(result.value); }
      let input: unknown; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return error(422, '입력 형식을 확인해 주세요.'); }
      if (request.method === 'POST') return reply(201, { data: await service.create(input) });
      if (request.method === 'PATCH') return service.update ? reply(200, { data: await service.update(id!, input) }) : error(405, '지원하지 않는 요청입니다.');
      await service.remove(id!, input); return new Response(null, { status: 204, headers });
    } catch (cause) {
      if (cause instanceof z.ZodError) return error(422, '입력 내용을 확인해 주세요.');
      if (cause instanceof MemberRecordNotFound) return error(404, '기록을 찾을 수 없습니다.');
      if (cause instanceof MemberRecordConflict) return error(409, '다른 곳에서 수정된 기록입니다. 다시 불러온 뒤 저장해 주세요.');
      // Never log tokens, personal text or raw database errors.
      console.error('Member record request failed'); return error(503, '기록을 처리하지 못했습니다. 다시 시도해 주세요.');
    }
  };
}
