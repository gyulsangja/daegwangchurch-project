import {financeTotals} from '@daegwang/contracts/finance';
import { z } from 'zod';
import { authOrigin } from '@/lib/auth-security';
import { readInput } from '@/lib/http';
import { financeSnapshot, receiptRegister, saveFinance, financeError } from '@/lib/finance';

export async function GET(request: Request) {
  try {
    const year = z.coerce.number().int().min(2000).max(2200).parse(new URL(request.url).searchParams.get('year'));
    const params = new URL(request.url).searchParams;
    if(params.has('register')) {
      const basis=z.enum(['issue','ledger']).parse(params.get('register'));
      return Response.json(await receiptRegister(year,basis==='issue'),{headers:{'Cache-Control':'private, no-store'}});
    }
    const period = params.has('start') || params.has('end') ? z.object({ start:z.iso.date(),end:z.iso.date() }).refine(p=>p.start<=p.end && [p.start,p.end].every(d=>Number(d.slice(0,4))===year)).parse({start:params.get('start'),end:params.get('end')}) : undefined;
    const snapshot=await financeSnapshot(year, period);
    if(params.get('committee')==='1'){
      if(!snapshot.role)return new Response(null,{status:403,headers:{'Cache-Control':'no-store'}});
      return Response.json({year,available:!!snapshot.version,closed:snapshot.closed,categories:snapshot.categories},{headers:{'Cache-Control':'private, no-store'}});
    }
    if(params.get('summary')==='1'){
      if(!snapshot.role)return new Response(null,{status:403,headers:{'Cache-Control':'no-store'}});
      const {income,expense,balance}=financeTotals(snapshot);
      return Response.json({available:!!snapshot.version,totals:{income,expense,balance}},{headers:{'Cache-Control':'private, no-store'}});
    }
    return Response.json(snapshot, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return financeError(error); }
}
export async function POST(request: Request) {
  if (!authOrigin(request)) return new Response(null, { status: 403 });
  try {
    const input = await readInput(request, 98304);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new SyntaxError();
    return Response.json(await saveFinance(input), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return financeError(error); }
}
