import { appEventHandlers } from '@daegwang/server/features/events/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return appEventHandlers.list(request); }
