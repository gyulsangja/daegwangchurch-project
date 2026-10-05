import { pushWorkerHandler } from '@daegwang/server/features/member/push-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export function POST(request: Request) { return pushWorkerHandler(request); }
