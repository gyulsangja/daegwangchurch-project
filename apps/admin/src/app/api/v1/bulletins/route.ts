import { appBulletinHandlers } from '@daegwang/server/features/bulletins/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return appBulletinHandlers.list(request); }
