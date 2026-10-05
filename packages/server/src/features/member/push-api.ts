import { timingSafeEqual } from 'node:crypto';
import { pushCredentialSchema } from '@daegwang/contracts/features/member/push';

export function createPushRevokeHandler(revoke: (input: unknown) => Promise<void>, allowedOrigins: () => string[]) {
  return async (request: Request) => {
    const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin' });
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin && !allowedOrigins().includes(origin)) return new Response(null, { status: 403, headers });
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') return new Response(null, { status: 405, headers });
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return new Response(null, { status: 415, headers });
    const reader = request.body?.getReader(); if (!reader) return new Response(null, { status: 422, headers });
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength; if (length > 1024) { await reader.cancel(); return new Response(null, { status: 413, headers }); } chunks.push(part.value); }
    let data: unknown;
    try { data = pushCredentialSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { return new Response(null, { status: 422, headers }); }
    try { await revoke(data); return new Response(null, { status: 204, headers }); }
    catch { return new Response(null, { status: 503, headers }); }
  };
}
export function createPushWorkerHandler(config: () => { available: boolean; workerSecret: string }, run: () => Promise<unknown>) {
  return async (request: Request) => {
    const settings = config(); const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
    const headers = { 'Cache-Control': 'no-store' };
    if (request.method !== 'POST') return new Response(null, { status: 405, headers });
    const supplied = Buffer.from(token); const expected = Buffer.from(settings.workerSecret);
    if (settings.workerSecret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return new Response(null, { status: 401, headers });
    if (!settings.available) return new Response(null, { status: 503, headers });
    try { return Response.json(await run(), { headers }); }
    catch { console.error('Push worker failed'); return Response.json({ error: 'Push worker failed' }, { status: 503, headers }); }
  };
}
