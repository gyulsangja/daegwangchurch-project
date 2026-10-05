import { accountHandler } from '@daegwang/server/features/member/account-server';
export const dynamic = 'force-dynamic';
export async function POST(request: Request, context: { params: Promise<{ operation: string }> }) { return accountHandler(request, (await context.params).operation); }
export async function OPTIONS(request: Request, context: { params: Promise<{ operation: string }> }) { return accountHandler(request, (await context.params).operation); }
