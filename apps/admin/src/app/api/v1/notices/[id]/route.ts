import { appNoticeHandlers } from '@daegwang/server/features/notices/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return appNoticeHandlers.detail((await context.params).id);
}
