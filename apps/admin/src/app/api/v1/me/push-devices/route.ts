import { pushDeviceHandler } from '@daegwang/server/features/member/push-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return pushDeviceHandler(request); }
export function POST(request: Request) { return pushDeviceHandler(request); }
export function OPTIONS(request: Request) { return pushDeviceHandler(request); }
