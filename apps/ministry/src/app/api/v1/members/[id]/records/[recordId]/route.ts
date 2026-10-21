import { handle, readInput } from '@/lib/http';
export async function PATCH(request: Request, { params }: { params: Promise<{id:string;recordId:string}> }) {
  return handle(request, async (service, actor) => { const {id,recordId} = await params; const input = await readInput(request); return service.records.correct(actor,id,recordId,input.reason); });
}
