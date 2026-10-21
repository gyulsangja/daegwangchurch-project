import { handle, readInput } from '@/lib/http';
export function POST(request: Request, { params }: { params: Promise<{ year: string }> }) { return handle(request, async (service, actor) => service.years.assign(actor, Number((await params).year), await readInput(request))); }
