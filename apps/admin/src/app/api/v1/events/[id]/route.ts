import { appEventHandlers } from '@daegwang/server/features/events/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return appEventHandlers.detail((await context.params).id);
}
