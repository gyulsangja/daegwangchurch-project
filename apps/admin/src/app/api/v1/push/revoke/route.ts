import { pushRevokeHandler } from '@daegwang/server/features/member/push-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function POST(request: Request) { return pushRevokeHandler(request); }
export function OPTIONS(request: Request) { return pushRevokeHandler(request); }
