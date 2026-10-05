import { z } from 'zod';
import { AccountOperationError } from './account-service';
import { deletionInputSchema, type DeletionPolicy } from './deletion-service';

export function createDeletionHandler(deps: {
  policy: () => DeletionPolicy | null;
  allowedOrigins: () => string[];
  authenticate: (token: string) => Promise<{ id: string; email: string } | null>;
  remove: (identity: { id: string; email: string }, input: unknown, policy: DeletionPolicy) => Promise<unknown>;
}) {
  return async (request: Request) => {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' });
    const error = (status: number, message: string) => Response.json({ error: { message } }, { status, headers });
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin && !deps.allowedOrigins().includes(origin)) return error(403, '허용되지 않은 요청입니다.');
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'DELETE,OPTIONS'); headers.set('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'DELETE') return error(405, '지원하지 않는 요청입니다.');
    const policy = deps.policy();
    if (!policy) return error(503, '탈퇴 정책과 처리 절차를 준비하고 있습니다.');
    const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];
    if (!token) return error(401, '로그인이 필요합니다.');
    try {
      const identity = await deps.authenticate(token);
      if (!identity) return error(401, '다시 로그인해 주세요.');
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return error(415, 'JSON 형식이 필요합니다.');
      const reader = request.body?.getReader(); if (!reader) return error(422, '내용을 확인해 주세요.');
      let length = 0; const chunks: Uint8Array[] = [];
      while (true) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength; if (length > 4096) { await reader.cancel(); return error(413, '입력이 너무 깁니다.'); } chunks.push(part.value); }
      let input: unknown; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return error(422, '입력을 확인해 주세요.'); }
      await deps.remove(identity, deletionInputSchema.parse(input), policy);
      return Response.json({ data: { status: 'accepted' } }, { status: 202, headers });
    } catch (cause) {
      if (cause instanceof z.ZodError) return error(422, '입력을 확인해 주세요.');
      if (cause instanceof AccountOperationError) {
        const messages: Record<number, string> = { 403: '관리자 계정은 앱에서 탈퇴할 수 없습니다.', 409: '탈퇴 안내가 변경되었습니다. 다시 확인해 주세요.', 422: '현재 비밀번호를 확인해 주세요.', 429: '잠시 기다린 뒤 다시 시도해 주세요.' };
        return error(cause.status, messages[cause.status] ?? '요청 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      return error(503, '요청 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };
}
