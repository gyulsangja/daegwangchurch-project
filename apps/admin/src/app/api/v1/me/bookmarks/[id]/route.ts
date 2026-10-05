import { bookmarkHandler } from '@daegwang/server/features/member/bookmark-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: Request, context: { params: Promise<{ id: string }> }) { return bookmarkHandler(request, (await context.params).id); }
export { handle as GET, handle as DELETE, handle as OPTIONS };
