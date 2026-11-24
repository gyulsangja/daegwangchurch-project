import { z } from 'zod';
import { authOrigin } from '@/lib/auth-security';
import { readInput } from '@/lib/http';
import { financeSnapshot, saveFinance, financeError } from '@/lib/finance';

export async function GET(request: Request) {
  try {
    const year = z.coerce.number().int().min(2000).max(2200).parse(new URL(request.url).searchParams.get('year'));
    return Response.json(await financeSnapshot(year), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return financeError(error); }
}
export async function POST(request: Request) {
  if (!authOrigin(request)) return new Response(null, { status: 403 });
  try {
    const input = await readInput(request, 16384);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new SyntaxError();
    return Response.json(await saveFinance(input), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return financeError(error); }
}
