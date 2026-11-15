import { timingSafeEqual } from 'node:crypto';

export function createWorkerHandler(config: () => { available: boolean; workerSecret: string }, run: () => Promise<unknown>, failureMessage = 'Worker failed') {
  return async (request: Request) => {
    const settings = config(); const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
    const headers = { 'Cache-Control': 'no-store' };
    if (request.method !== 'POST') return new Response(null, { status: 405, headers });
    const supplied = Buffer.from(token); const expected = Buffer.from(settings.workerSecret);
    if (settings.workerSecret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return new Response(null, { status: 401, headers });
    if (!settings.available) return new Response(null, { status: 503, headers });
    try { return Response.json(await run(), { headers }); }
    catch { console.error(failureMessage); return Response.json({ error: failureMessage }, { status: 503, headers }); }
  };
}
