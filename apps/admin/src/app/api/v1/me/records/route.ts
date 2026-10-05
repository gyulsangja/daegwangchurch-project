import { memberRecordHandler } from '@daegwang/server/features/member/record-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return memberRecordHandler(request); }
export function POST(request: Request) { return memberRecordHandler(request); }
export function OPTIONS(request: Request) { return memberRecordHandler(request); }
