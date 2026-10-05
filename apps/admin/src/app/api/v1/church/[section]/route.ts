import { appChurchHandler } from '@daegwang/server/features/church/app-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ section: string }> }) { return appChurchHandler((await context.params).section); }
