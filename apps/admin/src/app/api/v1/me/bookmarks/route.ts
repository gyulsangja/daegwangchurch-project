import { bookmarkHandler } from '@daegwang/server/features/member/bookmark-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return bookmarkHandler(request); }
export function POST(request: Request) { return bookmarkHandler(request); }
export function OPTIONS(request: Request) { return bookmarkHandler(request); }
