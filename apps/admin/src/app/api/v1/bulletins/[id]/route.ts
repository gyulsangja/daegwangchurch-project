import { appBulletinHandlers } from '@daegwang/server/features/bulletins/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return appBulletinHandlers.detail((await context.params).id);
}
