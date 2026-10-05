import { memberRecordHandler } from '@daegwang/server/features/member/record-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: Request, context: { params: Promise<{ id: string }> }) { return memberRecordHandler(request, (await context.params).id); }
export { handle as GET, handle as PATCH, handle as DELETE, handle as OPTIONS };
