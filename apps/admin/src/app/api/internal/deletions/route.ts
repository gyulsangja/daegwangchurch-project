import { deletionWorkerHandler } from '@daegwang/server/features/member/deletion-worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export function POST(request: Request) { return deletionWorkerHandler(request); }
