import { handle, readInput } from '@/lib/http';
export async function GET(request: Request, { params }: { params: Promise<{id:string}> }) {
  return handle(request, async (service, actor) => service.records.list(actor, (await params).id));
}
export async function POST(request: Request, { params }: { params: Promise<{id:string}> }) {
  return handle(request, async (service, actor) => service.records.add(actor, (await params).id, await readInput(request)));
}
