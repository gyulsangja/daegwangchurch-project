import { handle, readInput } from '@/lib/http';
export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return handle(request, async (service, actor) => service.update(actor, (await params).id, await readInput(request, 200000))); }
