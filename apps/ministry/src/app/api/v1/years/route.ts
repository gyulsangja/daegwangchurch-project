import { handle, readInput } from '@/lib/http';
export function GET(request: Request) { return handle(request, (service, actor) => service.years.list(actor)); }
export function POST(request: Request) { return handle(request, async (service, actor) => service.years.create(actor, await readInput(request))); }
