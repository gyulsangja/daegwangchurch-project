import { notificationHandler } from '@daegwang/server/features/member/notification-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return notificationHandler(request, (await context.params).id); }
export const PATCH = GET;
export const OPTIONS = GET;
