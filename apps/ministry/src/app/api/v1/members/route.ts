import { handle, readInput } from '@/lib/http';
export function GET(request: Request) { return handle(request, (service, actor) => service.list(actor, Object.fromEntries(new URL(request.url).searchParams))); }
export function POST(request: Request) { return handle(request, async (service, actor) => service.create(actor, await readInput(request, 200000))); }
