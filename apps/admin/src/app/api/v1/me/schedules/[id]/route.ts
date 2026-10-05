import { memberScheduleHandler } from '@daegwang/server/features/member/schedule-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: Request, context: { params: Promise<{ id: string }> }) { return memberScheduleHandler(request, (await context.params).id); }
export { handle as GET, handle as PATCH, handle as DELETE, handle as OPTIONS };
