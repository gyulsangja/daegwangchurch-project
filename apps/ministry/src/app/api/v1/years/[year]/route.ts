import { handle, readInput } from '@/lib/http';
type Context = { params: Promise<{ year: string }> };
export function GET(request: Request, { params }: Context) { return handle(request, async (service, actor) => service.years.read(actor, Number((await params).year))); }
export function PATCH(request: Request, { params }: Context) { return handle(request, async (service, actor) => service.years.configure(actor, Number((await params).year), await readInput(request))); }
