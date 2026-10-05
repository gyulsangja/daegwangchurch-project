import { notificationHandler } from '@daegwang/server/features/member/notification-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return notificationHandler(request); }
export function OPTIONS(request: Request) { return notificationHandler(request); }
