import { careHandler, groupHandler, profileHandler } from '@daegwang/server/features/member/operations-server';
export const dynamic = 'force-dynamic';
async function handle(request: Request, context: { params: Promise<{ resource: string }> }) {
  const { resource } = await context.params;
  if (resource === 'requests') return careHandler(request);
  if (resource === 'groups') return groupHandler(request, 'groups');
  if (resource === 'profile') return profileHandler(request);
  return Response.json({ error: { message: '요청한 서비스를 찾을 수 없습니다.' } }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
