import { appPrayerHandlers } from '@daegwang/server/features/notices/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return appPrayerHandlers.list(request); }
