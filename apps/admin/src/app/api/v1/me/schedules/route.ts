import { memberScheduleHandler } from '@daegwang/server/features/member/schedule-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return memberScheduleHandler(request); }
export function POST(request: Request) { return memberScheduleHandler(request); }
export function OPTIONS(request: Request) { return memberScheduleHandler(request); }
