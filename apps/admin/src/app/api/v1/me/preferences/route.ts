import { preferenceHandler } from '@daegwang/server/features/member/notification-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return preferenceHandler(request, 'preferences'); }
export const PATCH = GET;
export const OPTIONS = GET;
